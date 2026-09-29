import { useState, useEffect, useRef } from 'react';

export function useScale() {
    const [isConnected, setIsConnected] = useState(false);
    const [weight, setWeight] = useState(0);
    const [raw, setRaw] = useState('');
    const portRef = useRef<any>(null);
    const readerRef = useRef<any>(null);
    const keepReading = useRef(false);

    const connect = async () => {
        if (!("serial" in navigator)) {
            alert("Web Serial API no soportada en este navegador. Usa Chrome o Edge.");
            return;
        }

        try {
            const port = await (navigator as any).serial.requestPort();
            await port.open({ baudRate: 9600 }); // Default baudrate, configurable if needed

            portRef.current = port;
            setIsConnected(true);
            keepReading.current = true;

            readLoop();
        } catch (error) {
            console.error("Error conectando a la báscula:", error);
        }
    };

    const disconnect = async () => {
        keepReading.current = false;
        if (readerRef.current) {
            await readerRef.current.cancel();
        }
        if (portRef.current) {
            await portRef.current.close();
        }
        setIsConnected(false);
        setWeight(0);
        setRaw('');
    };

    const readLoop = async () => {
        const textDecoder = new TextDecoderStream();
        const readableStreamClosed = portRef.current.readable.pipeTo(textDecoder.writable);
        const reader = textDecoder.readable.getReader();
        readerRef.current = reader;

        try {
            while (keepReading.current) {
                const { value, done } = await reader.read();
                if (done) {
                    reader.releaseLock();
                    break;
                }
                if (value) {
                    setRaw(prev => {
                        const newVal = prev + value;
                        // Proagro scales usually send data like "+  12340kg" or similar
                        // We attempt to parse the last valid number found in the stream
                        // This logic might need strict adjustment based on actual ASCII protocol
                        parseWeight(newVal);
                        return newVal.slice(-50); // Keep buffer small
                    });
                }
            }
        } catch (error) {
            console.error("Error leyendo datos:", error);
            disconnect();
        } finally {
            reader.releaseLock();
        }
    };

    const parseWeight = (stream: string) => {
        // Regex to find generic numbers, likely followed by 'kg' or similar
        // Adjust regex based on specific hardware string format
        const matches = stream.match(/(\d+)(\.\d+)?/g);
        if (matches && matches.length > 0) {
            // Take the last complete number found
            const lastNum = parseFloat(matches[matches.length - 1]);
            if (!isNaN(lastNum)) {
                setWeight(lastNum);
            }
        }
    };

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (isConnected) disconnect();
        };
    }, []);

    return { connect, disconnect, isConnected, weight, raw };
}
