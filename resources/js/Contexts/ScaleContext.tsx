import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';

interface ScaleContextType {
    weight: number;
    isConnected: boolean;
    isReading: boolean;
    connectScale: () => Promise<void>;
    disconnectScale: () => Promise<void>;
    setManualWeight: (weight: number) => void;
}

const ScaleContext = createContext<ScaleContextType | undefined>(undefined);

export const ScaleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [weight, setWeight] = useState<number>(0);
    const [isConnected, setIsConnected] = useState(false);
    const [isReading, setIsReading] = useState(false);

    const portRef = useRef<any>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const isReadingRef = useRef(false);

    const disconnectScale = async () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        if (portRef.current) {
            try {
                const port = portRef.current;
                await port.close();
                portRef.current = null;
            } catch (err) {
                console.error("Error closing port:", err);
            }
        }
        setIsConnected(false);
        setIsReading(false);
        isReadingRef.current = false;
        setWeight(0);
    };

    const connectScale = async () => {
        if (!("serial" in navigator)) {
            throw new Error("API Web Serial no soportada en este navegador.");
        }

        try {
            let port = portRef.current;

            if (!port) {
                port = await (navigator as any).serial.requestPort();
                portRef.current = port;
            }

            if (port.readable && isReadingRef.current) {
                console.log("Ya leyendo de la báscula...");
                return;
            }

            // Abort previous read if any
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();
            const signal = abortControllerRef.current.signal;

            try {
                if (!port.opened) {
                    await port.open({ baudRate: 9600 });
                }
            } catch (err: any) {
                if (err.name !== 'InvalidStateError') throw err;
            }

            setIsConnected(true);
            setIsReading(true);
            isReadingRef.current = true;

            const textDecoder = new TextDecoderStream();
            const readableStreamClosed = port.readable.pipeTo(textDecoder.writable, { signal });
            const reader = textDecoder.readable.getReader();

            let buffer = "";
            console.log("Iniciando lectura de báscula global...");

            try {
                while (true) {
                    const { value, done } = await reader.read();
                    if (done || signal.aborted) break;
                    if (value) {
                        buffer += value;
                        if (buffer.includes("\n") || buffer.includes("\r")) {
                            const match = buffer.match(/(\d+(?:\.\d+)?)/);
                            if (match) {
                                const newWeight = parseFloat(match[1]);
                                setWeight(newWeight);
                            }
                            buffer = "";
                        }
                    }
                }
            } finally {
                reader.releaseLock();
                isReadingRef.current = false;
                setIsReading(false);
                console.log("Lectura finalizada / Puerto liberado.");
            }

        } catch (error: any) {
            isReadingRef.current = false;
            setIsReading(false);
            if (error.name === 'NotFoundError' || error.name === 'AbortError') {
                return;
            }
            setIsConnected(false);
            throw error;
        }
    };

    // Cleanup on unmount of the entire provider
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (portRef.current) {
                portRef.current.close().catch((err: any) => console.error("Auto-close error:", err));
            }
        };
    }, []);

    const setManualWeight = (newWeight: number) => {
        setWeight(newWeight);
    };

    return (
        <ScaleContext.Provider value={{ weight, isConnected, isReading, connectScale, disconnectScale, setManualWeight }}>
            {children}
        </ScaleContext.Provider>
    );
};

export const useScale = () => {
    const context = useContext(ScaleContext);
    if (context === undefined) {
        throw new Error('useScale must be used within a ScaleProvider');
    }
    return context;
};
