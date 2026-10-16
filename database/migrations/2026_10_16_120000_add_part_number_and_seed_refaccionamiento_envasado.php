<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Agrega part_number y puebla todos los insumos oficiales del Tipo 1 (Refaccionamiento Equipos de envasado).
     */
    public function up(): void
    {
        // 1. Asegurar columna part_number en supply_inventory_items
        if (!Schema::hasColumn('supply_inventory_items', 'part_number')) {
            Schema::table('supply_inventory_items', function (Blueprint $table) {
                $table->string('part_number', 100)->nullable()->after('code');
            });
        }

        // 2. Eliminar los registros anteriores del Tipo 1 para insertar la lista física completa actualizada
        DB::table('supply_inventory_items')->where('type_id', 1)->delete();

        // 3. Catálogo completo de Tipo 1 según documento oficial
        $type1Items = [
            // ==========================================
            // GRUPO 101: COSEDORAS (76 Registros)
            // ==========================================
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 1, 'code' => '1010001', 'name' => 'Banda de transmision A-32', 'part_number' => 'CS-001', 'stock' => 4, 'min_stock' => 1],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 2, 'code' => '1010002', 'name' => 'Alimentador dentado', 'part_number' => '10078', 'stock' => 4, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 3, 'code' => '1010003', 'name' => 'Anillo "O" 3/4" X 15/16"', 'part_number' => '15032', 'stock' => 5, 'min_stock' => 3],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 4, 'code' => '1010004', 'name' => 'Anillo, Liga-Sello (Alimentador dentado)', 'part_number' => '10124', 'stock' => 31, 'min_stock' => 3],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 5, 'code' => '1010005', 'name' => 'Arandela cierre', 'part_number' => '11120', 'stock' => 9, 'min_stock' => 3],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 6, 'code' => '1010006', 'name' => 'Arandela de empuje', 'part_number' => 'T3129', 'stock' => 9, 'min_stock' => 3],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 7, 'code' => '1010007', 'name' => 'Arandela plana 5', 'part_number' => 'WF5', 'stock' => 10, 'min_stock' => 3],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 8, 'code' => '1010008', 'name' => 'Arandela, Plana #10', 'part_number' => 'WF10', 'stock' => 16, 'min_stock' => 3],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 9, 'code' => '1010009', 'name' => 'Arandela, Resorte ¼', 'part_number' => '15076', 'stock' => 11, 'min_stock' => 3],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 10, 'code' => '1010010', 'name' => 'Biela, Levantador del pie prensatela', 'part_number' => '10142', 'stock' => 6, 'min_stock' => 1],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 11, 'code' => '1010011', 'name' => 'Casquillo, levantador de pie prénsatela', 'part_number' => '10139', 'stock' => 4, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 12, 'code' => '1010012', 'name' => 'Centro de polea', 'part_number' => '10038', 'stock' => 18, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 13, 'code' => '1010013', 'name' => 'Cojinete de empuje', 'part_number' => 'P4024', 'stock' => 5, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 14, 'code' => '1010014', 'name' => 'Collarin', 'part_number' => '15043', 'stock' => 2, 'min_stock' => 1],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 15, 'code' => '1010015', 'name' => 'Cuchilla fija', 'part_number' => '31032', 'stock' => 16, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 16, 'code' => '1010016', 'name' => 'Disco, tensión (Palanca de Aguja)', 'part_number' => '10119', 'stock' => 6, 'min_stock' => 1],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 17, 'code' => '1010017', 'name' => 'Disco, tensión grande', 'part_number' => '10120', 'stock' => 22, 'min_stock' => 1],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 18, 'code' => '1010018', 'name' => 'Eje palanca', 'part_number' => '10026', 'stock' => 1, 'min_stock' => 1],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 19, 'code' => '1010019', 'name' => 'Eje principal', 'part_number' => '31015', 'stock' => 3, 'min_stock' => 1],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 20, 'code' => '1010020', 'name' => 'Empaque, Sello del Eje Principal', 'part_number' => '10094', 'stock' => 1, 'min_stock' => 3],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 21, 'code' => '1010021', 'name' => 'Empaque, sello ojo engarzador', 'part_number' => '15105', 'stock' => 13, 'min_stock' => 3],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 22, 'code' => '1010022', 'name' => 'Empaque, Tapa – Colector de Escape (Manifold)', 'part_number' => '10095', 'stock' => 3, 'min_stock' => 3],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 23, 'code' => '1010023', 'name' => 'Empaque, Tapa –inferior', 'part_number' => '10093', 'stock' => 5, 'min_stock' => 3],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 24, 'code' => '1010024', 'name' => 'Empaque, Tapa –superior', 'part_number' => '10092', 'stock' => 9, 'min_stock' => 3],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 25, 'code' => '1010025', 'name' => 'Engarzador', 'part_number' => '10060', 'stock' => 4, 'min_stock' => 3],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 26, 'code' => '1010026', 'name' => 'Engranaje bomba', 'part_number' => '31028', 'stock' => 5, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 27, 'code' => '1010027', 'name' => 'Ensamble engranaje de bomba', 'part_number' => '31096', 'stock' => 2, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 28, 'code' => '1010028', 'name' => 'Forro, casquillo levantador del pie prénsatela', 'part_number' => '10186', 'stock' => 5, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 29, 'code' => '1010029', 'name' => 'Guarda de empaque dentado', 'part_number' => '10174', 'stock' => 3, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 30, 'code' => '1010030', 'name' => 'Mandril de aguja', 'part_number' => '10031', 'stock' => 3, 'min_stock' => 1],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 31, 'code' => '1010031', 'name' => 'Manga tensión', 'part_number' => '10114', 'stock' => 40, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 32, 'code' => '1010032', 'name' => 'Mango pie prensatela', 'part_number' => '10155', 'stock' => 1, 'min_stock' => 1],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 33, 'code' => '1010033', 'name' => 'Manómetro 1/8" 0-5 kg PSI', 'part_number' => '15053', 'stock' => 5, 'min_stock' => 1],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 34, 'code' => '1010034', 'name' => 'Micro para pedal', 'part_number' => '6023009', 'stock' => 15, 'min_stock' => 3],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 35, 'code' => '1010035', 'name' => 'Montaje cuchilla de biela', 'part_number' => '10080', 'stock' => 6, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 36, 'code' => '1010036', 'name' => 'Montaje, sello de eje principal', 'part_number' => '10035', 'stock' => 8, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 37, 'code' => '1010037', 'name' => 'Opresor allen', 'part_number' => 'FS583231660', 'stock' => 9, 'min_stock' => 3],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 38, 'code' => '1010038', 'name' => 'Opresor allen 1/4 x 3/8', 'part_number' => 'CS-002', 'stock' => 9, 'min_stock' => 3],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 39, 'code' => '1010039', 'name' => 'Perno tensión', 'part_number' => '10115', 'stock' => 5, 'min_stock' => 3],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 40, 'code' => '1010040', 'name' => 'Placa garganta', 'part_number' => '10017', 'stock' => 4, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 41, 'code' => '1010041', 'name' => 'Polea ajustable', 'part_number' => '10199', 'stock' => 4, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 42, 'code' => '1010042', 'name' => 'Resorte de cuchilla', 'part_number' => '10089', 'stock' => 10, 'min_stock' => 3],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 43, 'code' => '1010043', 'name' => 'Resorte tension aguja hilo', 'part_number' => '10007', 'stock' => 6, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 44, 'code' => '1010044', 'name' => 'Resorte tensión engarzador', 'part_number' => '10008', 'stock' => 8, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 45, 'code' => '1010045', 'name' => 'Resorte tensión palanca de aguja', 'part_number' => '10009', 'stock' => 18, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 46, 'code' => '1010046', 'name' => 'Resorte, levantador de palanca', 'part_number' => '10187', 'stock' => 9, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 47, 'code' => '1010047', 'name' => 'Resorte, Liga del Sello de Palanca', 'part_number' => '10128', 'stock' => 12, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 48, 'code' => '1010048', 'name' => 'Sello de palanca', 'part_number' => '31014', 'stock' => 6, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 49, 'code' => '1010049', 'name' => 'Sello para alimentador dentado', 'part_number' => '10077', 'stock' => 7, 'min_stock' => 3],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 50, 'code' => '1010050', 'name' => 'Sostenedor del engarzador', 'part_number' => '10059', 'stock' => 5, 'min_stock' => 1],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 51, 'code' => '1010051', 'name' => 'Sujetador de prensatela', 'part_number' => '10156', 'stock' => 2, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 52, 'code' => '1010052', 'name' => 'Tornillo allen para brazo 6 x 2mm', 'part_number' => 'CS-003', 'stock' => 1, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 53, 'code' => '1010053', 'name' => 'Tornillo hexagonal HD 10-32 X 7/8', 'part_number' => 'H103278', 'stock' => 3, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 54, 'code' => '1010054', 'name' => 'Tornillo hueco de fijación 8-32 x 3/16', 'part_number' => 'SS832316', 'stock' => 10, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 55, 'code' => '1010055', 'name' => 'Tornillo hueco de fijación 8-32 x 3/16 punta de cono', 'part_number' => 'SS832316CP', 'stock' => 10, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 56, 'code' => '1010056', 'name' => 'Tornillo para base de cosedora', 'part_number' => '6614008', 'stock' => 7, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 57, 'code' => '1010057', 'name' => 'Tornillo pasador de prensatela', 'part_number' => '10182', 'stock' => 2, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 58, 'code' => '1010058', 'name' => 'Tornillo sujetador de aguja', 'part_number' => '10011', 'stock' => 8, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 59, 'code' => '1010059', 'name' => 'Tornillo, Cabeza Hueca 10-32 x ¾', 'part_number' => 'SC103234', 'stock' => 23, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 60, 'code' => '1010060', 'name' => 'Tornillo, Cabeza Hueca 6-32 x ¾', 'part_number' => 'SC63234', 'stock' => 26, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 61, 'code' => '1010061', 'name' => 'Tornillo, cabezal hueco 5-40 x ½', 'part_number' => 'SCS4012', 'stock' => 9, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 62, 'code' => '1010062', 'name' => 'Tornillo, Hexagonal 1/4-28 X 1/2 GR8 LG LOK', 'part_number' => '31026', 'stock' => 6, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 63, 'code' => '1010063', 'name' => 'Tornillo, Hexagonal 10-32 x 5/8', 'part_number' => 'H103258', 'stock' => 6, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 64, 'code' => '1010064', 'name' => 'Tornillo, Hexagonal HD 10-32 x 1/2', 'part_number' => 'H103212', 'stock' => 15, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 65, 'code' => '1010065', 'name' => 'Tornillo, Hueco de Fijación ¼- 20 x 3/8', 'part_number' => '15108', 'stock' => 18, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 66, 'code' => '1010066', 'name' => 'Tornillo, Hueco de Fijación ¼-20 x 3/8', 'part_number' => 'SS142038', 'stock' => 10, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 67, 'code' => '1010067', 'name' => 'Tornillo, Hueco de Fijación 10-32 x ½', 'part_number' => 'SC103212', 'stock' => 7, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 68, 'code' => '1010068', 'name' => 'Tornillo, Hueco de Fijación 10-32 x 5/16', 'part_number' => 'SS1032516', 'stock' => 10, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 69, 'code' => '1010069', 'name' => 'Tornillo, Hueco Plano #10-32 x 5/8', 'part_number' => 'SF103258', 'stock' => 33, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 70, 'code' => '1010070', 'name' => 'Tornillo, Plana 10-32 x ½', 'part_number' => 'F103212', 'stock' => 19, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 71, 'code' => '1010071', 'name' => 'Tornillo, Plano #8-32 x ¼', 'part_number' => 'F83214', 'stock' => 24, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 72, 'code' => '1010072', 'name' => 'Tornillo, Plano 10-32 x 3/8', 'part_number' => 'F103238', 'stock' => 31, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 73, 'code' => '1010073', 'name' => 'Tornillo, Ranurado Atador HD 10-32 x 1/4', 'part_number' => '103214', 'stock' => 6, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 74, 'code' => '1010074', 'name' => 'Tuerca ¼-28 cierre', 'part_number' => 'NH1428L', 'stock' => 6, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 75, 'code' => '1010075', 'name' => 'Tuerca para pasador de prensatela', 'part_number' => '11309', 'stock' => 7, 'min_stock' => 2],
            ['group_number' => 101, 'group_name' => 'Cosedoras', 'seq' => 76, 'code' => '1010076', 'name' => 'Varilla, Conectiva Principal del Ritmo del Alimentador', 'part_number' => '31023', 'stock' => 2, 'min_stock' => 1],

            // ==========================================
            // GRUPO 102: ENVASADORAS (43 Registros)
            // ==========================================
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 1, 'code' => '1020001', 'name' => 'Bisagra N/P G6-5-1', 'part_number' => '6113002', 'stock' => 2, 'min_stock' => 0],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 2, 'code' => '1020002', 'name' => 'Block de contacto NA', 'part_number' => '6007002', 'stock' => 11, 'min_stock' => 2],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 3, 'code' => '1020003', 'name' => 'Block de contacto NC', 'part_number' => '6007001', 'stock' => 11, 'min_stock' => 2],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 4, 'code' => '1020004', 'name' => 'Block para piloto luminoso 230V leg 229 40', 'part_number' => '6007004', 'stock' => 5, 'min_stock' => 2],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 5, 'code' => '1020005', 'name' => 'Boton rasante verde LEG 238 02', 'part_number' => '6007008', 'stock' => 3, 'min_stock' => 2],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 6, 'code' => '1020006', 'name' => 'Cable malla para tierra', 'part_number' => '6010001', 'stock' => 11, 'min_stock' => 2],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 7, 'code' => '1020007', 'name' => 'Caja plástica 1 barreno', 'part_number' => '6001040', 'stock' => 2, 'min_stock' => 1],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 8, 'code' => '1020008', 'name' => 'Cilindro neumático 32-15', 'part_number' => '6201001', 'stock' => 15, 'min_stock' => 3],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 9, 'code' => '1020009', 'name' => 'Conexión "T" 6mm x 1/8', 'part_number' => '6202031', 'stock' => 4, 'min_stock' => 2],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 10, 'code' => '1020010', 'name' => 'Conexión "Y"', 'part_number' => '6202029', 'stock' => 15, 'min_stock' => 2],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 11, 'code' => '1020011', 'name' => 'Conexión codo 6mm x 1/4', 'part_number' => '6202023', 'stock' => 13, 'min_stock' => 2],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 12, 'code' => '1020012', 'name' => 'Electroválvula 5 vías 24v', 'part_number' => '6203004', 'stock' => 7, 'min_stock' => 3],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 13, 'code' => '1020013', 'name' => 'Fusibles rápidos americano', 'part_number' => '6018002', 'stock' => 2, 'min_stock' => 1],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 14, 'code' => '1020014', 'name' => 'Juego de cilindro neumatico doble acción completo', 'part_number' => '6901003-SS', 'stock' => 13, 'min_stock' => 5],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 15, 'code' => '1020015', 'name' => 'Juego de unidad de mantenimiento con placa y tornillos', 'part_number' => '6901162', 'stock' => 9, 'min_stock' => 2],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 16, 'code' => '1020016', 'name' => 'Limit swich', 'part_number' => '6023044', 'stock' => 10, 'min_stock' => 5],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 17, 'code' => '1020017', 'name' => 'Maneral de plástico', 'part_number' => '6701004', 'stock' => 10, 'min_stock' => 1],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 18, 'code' => '1020018', 'name' => 'Manguera de conexión', 'part_number' => 'ES-001', 'stock' => 8, 'min_stock' => 1],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 19, 'code' => '1020019', 'name' => 'Mariposa de ajuste de display', 'part_number' => 'ES-002', 'stock' => 2, 'min_stock' => 1],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 20, 'code' => '1020020', 'name' => 'Paro de emergencia con retención', 'part_number' => '6007011', 'stock' => 8, 'min_stock' => 2],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 21, 'code' => '1020021', 'name' => 'Pedal armado para cosedora', 'part_number' => '7901034', 'stock' => 5, 'min_stock' => 1],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 22, 'code' => '1020022', 'name' => 'Perilla de plástico con rosca', 'part_number' => '6502021', 'stock' => 13, 'min_stock' => 1],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 23, 'code' => '1020023', 'name' => 'Rodamiento 6005', 'part_number' => '6005', 'stock' => 21, 'min_stock' => 5],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 24, 'code' => '1020024', 'name' => 'Rodamiento 6204', 'part_number' => '6204', 'stock' => 35, 'min_stock' => 5],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 25, 'code' => '1020025', 'name' => 'Rodamiento 6303', 'part_number' => '6303', 'stock' => 29, 'min_stock' => 5],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 26, 'code' => '1020026', 'name' => 'Rodamiento 51105', 'part_number' => '51105', 'stock' => 23, 'min_stock' => 5],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 27, 'code' => '1020027', 'name' => 'Rodamiento 6202', 'part_number' => '6202', 'stock' => 44, 'min_stock' => 5],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 28, 'code' => '1020028', 'name' => 'Rodamiento 6203', 'part_number' => '6203', 'stock' => 39, 'min_stock' => 5],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 29, 'code' => '1020029', 'name' => 'Rodamiento L44649', 'part_number' => 'L44649', 'stock' => 23, 'min_stock' => 5],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 30, 'code' => '1020030', 'name' => 'Rodamiento 6205', 'part_number' => '6205', 'stock' => 55, 'min_stock' => 5],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 31, 'code' => '1020031', 'name' => 'Rodamiento conico L68149', 'part_number' => 'L68149', 'stock' => 10, 'min_stock' => 5],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 32, 'code' => '1020032', 'name' => 'Rondana de presión 3/8"', 'part_number' => '6627006', 'stock' => 31, 'min_stock' => 3],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 33, 'code' => '1020033', 'name' => 'Rondana plana 3/8" inox', 'part_number' => '6625006', 'stock' => 6, 'min_stock' => 3],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 34, 'code' => '1020034', 'name' => 'Soporte sencillo', 'part_number' => '6007005', 'stock' => 7, 'min_stock' => 2],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 35, 'code' => '1020035', 'name' => 'Soporte triple para block leg 229 64 NP', 'part_number' => '6007006', 'stock' => 7, 'min_stock' => 2],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 36, 'code' => '1020036', 'name' => 'Tacón de hule para zapata', 'part_number' => '1303010', 'stock' => 32, 'min_stock' => 10],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 37, 'code' => '1020037', 'name' => 'Tapa para maneral de plástico', 'part_number' => '6701005', 'stock' => 13, 'min_stock' => 2],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 38, 'code' => '1020038', 'name' => 'Tapa troquelada para repuesto', 'part_number' => '1301014-SS', 'stock' => 4, 'min_stock' => 1],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 39, 'code' => '1020039', 'name' => 'Tasas p/ rodamiento', 'part_number' => 'L44610', 'stock' => 23, 'min_stock' => 2],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 40, 'code' => '1020040', 'name' => 'Tazon', 'part_number' => 'L68111', 'stock' => 10, 'min_stock' => 2],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 41, 'code' => '1020041', 'name' => 'Tornillo cabeza hexagonal 3/8 x 1 1/4 inox', 'part_number' => '6609018', 'stock' => 2, 'min_stock' => 0],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 42, 'code' => '1020042', 'name' => 'Tuerca hexagonal de 1/4"', 'part_number' => '6618004', 'stock' => 14, 'min_stock' => 2],
            ['group_number' => 102, 'group_name' => 'Envasadoras', 'seq' => 43, 'code' => '1020043', 'name' => 'Tuerca perilla estrella', 'part_number' => '6113010', 'stock' => 2, 'min_stock' => 1],

            // ==========================================
            // GRUPO 103: BANDAS TRANSPORTADORAS (23 Registros)
            // ==========================================
            ['group_number' => 103, 'group_name' => 'Bandas', 'seq' => 1, 'code' => '1030001', 'name' => 'Brida para tensar motor', 'part_number' => '1001060-GP', 'stock' => 2, 'min_stock' => 1],
            ['group_number' => 103, 'group_name' => 'Bandas', 'seq' => 2, 'code' => '1030002', 'name' => 'Cadena paso 50', 'part_number' => '6418002', 'stock' => 4, 'min_stock' => 1],
            ['group_number' => 103, 'group_name' => 'Bandas', 'seq' => 3, 'code' => '1030003', 'name' => 'Candado paso 50', 'part_number' => '6418008', 'stock' => 13, 'min_stock' => 1],
            ['group_number' => 103, 'group_name' => 'Bandas', 'seq' => 4, 'code' => '1030004', 'name' => 'Castigo fijo de aluminio C/ rosca 3/8" P/tubo de 3"', 'part_number' => '10011006', 'stock' => 10, 'min_stock' => 1],
            ['group_number' => 103, 'group_name' => 'Bandas', 'seq' => 5, 'code' => '1030005', 'name' => 'Castigo fijo de aluminio con rosca 3/8" P/tubo de 4"', 'part_number' => '1001047', 'stock' => 10, 'min_stock' => 1],
            ['group_number' => 103, 'group_name' => 'Bandas', 'seq' => 6, 'code' => '1030006', 'name' => 'Castigo fijo de aluminio S/ rosca 3/8" P/tubo de 3"', 'part_number' => '1001107', 'stock' => 10, 'min_stock' => 1],
            ['group_number' => 103, 'group_name' => 'Bandas', 'seq' => 7, 'code' => '1030007', 'name' => 'Castigo fijo de alumino sin rosca P/tubo de 4"', 'part_number' => '1001048', 'stock' => 10, 'min_stock' => 1],
            ['group_number' => 103, 'group_name' => 'Bandas', 'seq' => 8, 'code' => '1030008', 'name' => 'Catarina 50-19 1-1/2" X 1/4"', 'part_number' => '6412008', 'stock' => 4, 'min_stock' => 1],
            ['group_number' => 103, 'group_name' => 'Bandas', 'seq' => 9, 'code' => '1030009', 'name' => 'Chumacera de pared DE 1 1/4" 4 barrenos inox termoplastica', 'part_number' => '6102015', 'stock' => 4, 'min_stock' => 1],
            ['group_number' => 103, 'group_name' => 'Bandas', 'seq' => 10, 'code' => '1030010', 'name' => 'Cuerpo rodillo transmision 6 5/8" X 3/16', 'part_number' => '1001009-SS', 'stock' => 4, 'min_stock' => 1],
            ['group_number' => 103, 'group_name' => 'Bandas', 'seq' => 11, 'code' => '1030011', 'name' => 'Juego de sistema tensor p/rodillo JDA', 'part_number' => '6901086-SS', 'stock' => 8, 'min_stock' => 1],
            ['group_number' => 103, 'group_name' => 'Bandas', 'seq' => 12, 'code' => '1030012', 'name' => 'Polea aluminio 4" 1RA 5/8 X 3/16', 'part_number' => '6420017', 'stock' => 5, 'min_stock' => 1],
            ['group_number' => 103, 'group_name' => 'Bandas', 'seq' => 13, 'code' => '1030013', 'name' => 'Repuesto de chumacera de 1"', 'part_number' => '6102014', 'stock' => 2, 'min_stock' => 1],
            ['group_number' => 103, 'group_name' => 'Bandas', 'seq' => 14, 'code' => '1030014', 'name' => 'Rodillo de retorno de 2X20 Inox', 'part_number' => '1101026-SS', 'stock' => 6, 'min_stock' => 1],
            ['group_number' => 103, 'group_name' => 'Bandas', 'seq' => 15, 'code' => '1030015', 'name' => 'Rodillo de retorno de 3X20 Inox', 'part_number' => '1101014-55', 'stock' => 2, 'min_stock' => 1],
            ['group_number' => 103, 'group_name' => 'Bandas', 'seq' => 16, 'code' => '1030016', 'name' => 'Rodillo retorno 2" X 14"', 'part_number' => '1001013-SS', 'stock' => 2, 'min_stock' => 1],
            ['group_number' => 103, 'group_name' => 'Bandas', 'seq' => 17, 'code' => '1030017', 'name' => 'Rueda de 6" X 2"', 'part_number' => '6112039', 'stock' => 3, 'min_stock' => 2],
            ['group_number' => 103, 'group_name' => 'Bandas', 'seq' => 18, 'code' => '1030018', 'name' => 'Solera sujeccion motorreductor Inox', 'part_number' => '1001029-SS', 'stock' => 3, 'min_stock' => 1],
            ['group_number' => 103, 'group_name' => 'Bandas', 'seq' => 19, 'code' => '1030019', 'name' => 'Tornillo cabeza hexagonal 3/8" X 2-1/2"', 'part_number' => '6609022', 'stock' => 10, 'min_stock' => 2],
            ['group_number' => 103, 'group_name' => 'Bandas', 'seq' => 20, 'code' => '1030020', 'name' => 'Tornillo cabeza plana allen 3/8 x 1INOX', 'part_number' => '6614008', 'stock' => 11, 'min_stock' => 2],
            ['group_number' => 103, 'group_name' => 'Bandas', 'seq' => 21, 'code' => '1030021', 'name' => 'Banda Grip', 'part_number' => '6118008', 'stock' => 2, 'min_stock' => 1],
            ['group_number' => 103, 'group_name' => 'Bandas', 'seq' => 22, 'code' => '1030022', 'name' => 'Banda PVC 120 lisa negra 12 x 7.1m con grapas, pasador y segur…', 'part_number' => '6124006', 'stock' => 1, 'min_stock' => 1],
            ['group_number' => 103, 'group_name' => 'Bandas', 'seq' => 23, 'code' => '1030023', 'name' => 'Rueda de 8" X 3"', 'part_number' => 'BT-001', 'stock' => 6, 'min_stock' => 2],

            // ==========================================
            // GRUPO 104: BASCULAS DE PISO (2 Registros)
            // ==========================================
            ['group_number' => 104, 'group_name' => 'Basculas de piso', 'seq' => 1, 'code' => '1040001', 'name' => 'Tuerca ajustable para display', 'part_number' => 'BP-001', 'stock' => 10, 'min_stock' => 0],
            ['group_number' => 104, 'group_name' => 'Basculas de piso', 'seq' => 2, 'code' => '1040002', 'name' => 'Eliminador de corriente para bascula de piso', 'part_number' => 'BP-002', 'stock' => 0, 'min_stock' => 3],

            // ==========================================
            // GRUPO 105: COMPRESORES (12 Registros)
            // ==========================================
            ['group_number' => 105, 'group_name' => 'Compresores', 'seq' => 1, 'code' => '1050001', 'name' => 'Cople espiga de 1/4"', 'part_number' => 'CP-001', 'stock' => 8, 'min_stock' => 3],
            ['group_number' => 105, 'group_name' => 'Compresores', 'seq' => 2, 'code' => '1050002', 'name' => 'Conexión rosca externa y espiga', 'part_number' => 'CP-002', 'stock' => 2, 'min_stock' => 2],
            ['group_number' => 105, 'group_name' => 'Compresores', 'seq' => 3, 'code' => '1050003', 'name' => 'Perno', 'part_number' => 'CP-003', 'stock' => 6, 'min_stock' => 2],
            ['group_number' => 105, 'group_name' => 'Compresores', 'seq' => 4, 'code' => '1050004', 'name' => 'Valvula de seguridad 1/4"', 'part_number' => 'CP-004', 'stock' => 10, 'min_stock' => 2],
            ['group_number' => 105, 'group_name' => 'Compresores', 'seq' => 5, 'code' => '1050005', 'name' => 'Tee de 1/4" rosca interna', 'part_number' => 'CP-005', 'stock' => 12, 'min_stock' => 2],
            ['group_number' => 105, 'group_name' => 'Compresores', 'seq' => 6, 'code' => '1050006', 'name' => 'Tee rosca externa', 'part_number' => 'CP-006', 'stock' => 19, 'min_stock' => 2],
            ['group_number' => 105, 'group_name' => 'Compresores', 'seq' => 7, 'code' => '1050007', 'name' => 'Valvula de compuerta', 'part_number' => 'CP-007', 'stock' => 1, 'min_stock' => 1],
            ['group_number' => 105, 'group_name' => 'Compresores', 'seq' => 8, 'code' => '1050008', 'name' => 'Codo rosca interna', 'part_number' => 'CP-008', 'stock' => 2, 'min_stock' => 1],
            ['group_number' => 105, 'group_name' => 'Compresores', 'seq' => 9, 'code' => '1050009', 'name' => 'Manometro (50 mm, Rango 0-11 kg/cm2 PSI)', 'part_number' => 'CP-009', 'stock' => 6, 'min_stock' => 2],
            ['group_number' => 105, 'group_name' => 'Compresores', 'seq' => 10, 'code' => '1050010', 'name' => 'Manometro (50 mm, Rango 0-14 kg/cm2 PSI)', 'part_number' => 'CP-010', 'stock' => 7, 'min_stock' => 2],
            ['group_number' => 105, 'group_name' => 'Compresores', 'seq' => 11, 'code' => '1050011', 'name' => 'A-46 (Banda)', 'part_number' => 'CP-011', 'stock' => 6, 'min_stock' => 2],
            ['group_number' => 105, 'group_name' => 'Compresores', 'seq' => 12, 'code' => '1050012', 'name' => 'A-51 (Banda)', 'part_number' => 'CP-012', 'stock' => 10, 'min_stock' => 2],

            // ==========================================
            // GRUPO 106: TOLVAS DE ALIMENTACION (1 Registro)
            // ==========================================
            ['group_number' => 106, 'group_name' => 'Tolvas de alimentacion', 'seq' => 1, 'code' => '1060001', 'name' => 'Tolvas de alimentacion', 'part_number' => 'N/P', 'stock' => 0, 'min_stock' => 5],

            // ==========================================
            // GRUPO 107: RODAMIENTOS (9 Registros)
            // ==========================================
            ['group_number' => 107, 'group_name' => 'Rodamientos', 'seq' => 1, 'code' => '1070001', 'name' => 'Rodamiento 6005', 'part_number' => '6005', 'stock' => 21, 'min_stock' => 5],
            ['group_number' => 107, 'group_name' => 'Rodamientos', 'seq' => 2, 'code' => '1070002', 'name' => 'Rodamiento 6204', 'part_number' => '6204', 'stock' => 35, 'min_stock' => 5],
            ['group_number' => 107, 'group_name' => 'Rodamientos', 'seq' => 3, 'code' => '1070003', 'name' => 'Rodamiento 6303', 'part_number' => '6303', 'stock' => 29, 'min_stock' => 5],
            ['group_number' => 107, 'group_name' => 'Rodamientos', 'seq' => 4, 'code' => '1070004', 'name' => 'Rodamiento 51105', 'part_number' => '51105', 'stock' => 23, 'min_stock' => 5],
            ['group_number' => 107, 'group_name' => 'Rodamientos', 'seq' => 5, 'code' => '1070005', 'name' => 'Rodamiento 6202', 'part_number' => '6202', 'stock' => 44, 'min_stock' => 5],
            ['group_number' => 107, 'group_name' => 'Rodamientos', 'seq' => 6, 'code' => '1070006', 'name' => 'Rodamiento 6203', 'part_number' => '6203', 'stock' => 39, 'min_stock' => 5],
            ['group_number' => 107, 'group_name' => 'Rodamientos', 'seq' => 7, 'code' => '1070007', 'name' => 'Rodamiento L44649', 'part_number' => 'L44649', 'stock' => 23, 'min_stock' => 5],
            ['group_number' => 107, 'group_name' => 'Rodamientos', 'seq' => 8, 'code' => '1070008', 'name' => 'Rodamiento 6205', 'part_number' => '6205', 'stock' => 55, 'min_stock' => 5],
            ['group_number' => 107, 'group_name' => 'Rodamientos', 'seq' => 9, 'code' => '1070009', 'name' => 'Rodamiento conico L68149', 'part_number' => 'L68149', 'stock' => 10, 'min_stock' => 5],

            // ==========================================
            // GRUPO 108: TORNILLERIA (21 Registros)
            // ==========================================
            ['group_number' => 108, 'group_name' => 'Tornilleria', 'seq' => 1, 'code' => '1080001', 'name' => 'Arandela de presion de 5/16"', 'part_number' => 'N/P', 'stock' => 39, 'min_stock' => 3],
            ['group_number' => 108, 'group_name' => 'Tornilleria', 'seq' => 2, 'code' => '1080002', 'name' => 'Arandela plana de 3/4" inox', 'part_number' => 'N/P', 'stock' => 13, 'min_stock' => 3],
            ['group_number' => 108, 'group_name' => 'Tornilleria', 'seq' => 3, 'code' => '1080003', 'name' => 'Arandela plana de 5/16"', 'part_number' => 'N/P', 'stock' => 27, 'min_stock' => 3],
            ['group_number' => 108, 'group_name' => 'Tornilleria', 'seq' => 4, 'code' => '1080004', 'name' => 'Chaveta 3/32 x 1 Inox', 'part_number' => '6636002', 'stock' => 10, 'min_stock' => 3],
            ['group_number' => 108, 'group_name' => 'Tornilleria', 'seq' => 5, 'code' => '1080005', 'name' => 'Opresor 1/4" x 1 inox', 'part_number' => '6633001', 'stock' => 10, 'min_stock' => 3],
            ['group_number' => 108, 'group_name' => 'Tornilleria', 'seq' => 6, 'code' => '1080006', 'name' => 'Perno espiral', 'part_number' => 'N/P', 'stock' => 2, 'min_stock' => 1],
            ['group_number' => 108, 'group_name' => 'Tornilleria', 'seq' => 7, 'code' => '1080007', 'name' => 'Perno maneral compuerta de flujo Inox.', 'part_number' => '1301029-SS', 'stock' => 6, 'min_stock' => 1],
            ['group_number' => 108, 'group_name' => 'Tornilleria', 'seq' => 8, 'code' => '1080008', 'name' => 'Tornillo allen 3/16 x 2 Inox', 'part_number' => '6602002', 'stock' => 25, 'min_stock' => 3],
            ['group_number' => 108, 'group_name' => 'Tornilleria', 'seq' => 9, 'code' => '1080009', 'name' => 'Tornillo allen 8 x 40 Inox', 'part_number' => '6602007', 'stock' => 8, 'min_stock' => 3],
            ['group_number' => 108, 'group_name' => 'Tornilleria', 'seq' => 10, 'code' => '1080010', 'name' => 'Tornillo cabeza de coche 3/8 X 3/4 Inox', 'part_number' => '6605005', 'stock' => 10, 'min_stock' => 3],
            ['group_number' => 108, 'group_name' => 'Tornilleria', 'seq' => 11, 'code' => '1080011', 'name' => 'Tornillo con cabeza hexagonal 5/16x 1 1/2"', 'part_number' => 'N/P', 'stock' => 16, 'min_stock' => 3],
            ['group_number' => 108, 'group_name' => 'Tornilleria', 'seq' => 12, 'code' => '1080012', 'name' => 'Tornillo hexagonal 1/4" x 1" Inox', 'part_number' => '6609003', 'stock' => 11, 'min_stock' => 3],
            ['group_number' => 108, 'group_name' => 'Tornilleria', 'seq' => 13, 'code' => '1080013', 'name' => 'Tornillo hexagonal Inox. 5/16 x 1" 1/2"', 'part_number' => 'N/P', 'stock' => 18, 'min_stock' => 3],
            ['group_number' => 108, 'group_name' => 'Tornilleria', 'seq' => 14, 'code' => '1080014', 'name' => 'Tornillo hexagonal Inox. 5/16 x 1" 1/4"', 'part_number' => 'N/P', 'stock' => 6, 'min_stock' => 3],
            ['group_number' => 108, 'group_name' => 'Tornilleria', 'seq' => 15, 'code' => '1080015', 'name' => 'Tornillo inox cabeza hexagonal con tuerca 7/16 x 2 1/2"', 'part_number' => 'N/P', 'stock' => 3, 'min_stock' => 3],
            ['group_number' => 108, 'group_name' => 'Tornilleria', 'seq' => 16, 'code' => '1080016', 'name' => 'Tornillo inox cabeza hexagonal con tuerca 7/16 x 2"', 'part_number' => 'N/P', 'stock' => 4, 'min_stock' => 3],
            ['group_number' => 108, 'group_name' => 'Tornilleria', 'seq' => 17, 'code' => '1080017', 'name' => 'Tornillos inox cabeza hexagonal con tuerca 1 1/2 x 3/4', 'part_number' => 'N/P', 'stock' => 18, 'min_stock' => 3],
            ['group_number' => 108, 'group_name' => 'Tornilleria', 'seq' => 18, 'code' => '1080018', 'name' => 'Tuerca de seguridad 3/8 16nc Inox', 'part_number' => '6622003', 'stock' => 33, 'min_stock' => 3],
            ['group_number' => 108, 'group_name' => 'Tornilleria', 'seq' => 19, 'code' => '1080019', 'name' => 'Tornillo cabeza hexagonal 3/8 x 3 1/2 Inox', 'part_number' => '6609024', 'stock' => 10, 'min_stock' => 3],
            ['group_number' => 108, 'group_name' => 'Tornilleria', 'seq' => 20, 'code' => '1080020', 'name' => 'Tornillo cabeza hexagonal 3/8 x 4 1/2 Inox', 'part_number' => '6609026', 'stock' => 10, 'min_stock' => 3],
            ['group_number' => 108, 'group_name' => 'Tornilleria', 'seq' => 21, 'code' => '1080021', 'name' => 'Arandela plana para seguro de chicote de banda', 'part_number' => 'N/P', 'stock' => 7, 'min_stock' => 3],
        ];

        $now = now();
        $insertRows = [];

        foreach ($type1Items as $row) {
            $consecutive = str_pad((string) $row['seq'], 4, '0', STR_PAD_LEFT);
            $insertRows[] = [
                'type_id' => 1,
                'type_name' => 'Refaccionamiento Equipos de envasado',
                'type_slug' => 'refaccionamiento-equipos-de-envasado',
                'group_number' => $row['group_number'],
                'group_name' => $row['group_name'],
                'consecutive' => $consecutive,
                'code' => $row['code'],
                'part_number' => $row['part_number'] !== 'N/P' ? $row['part_number'] : null,
                'name' => $row['name'],
                'description' => 'Refacción de ' . $row['group_name'] . ($row['part_number'] !== 'N/P' ? ' (N/P: ' . $row['part_number'] . ')' : ''),
                'unit' => 'PZA',
                'stock' => (float) $row['stock'],
                'min_stock' => (float) $row['min_stock'],
                'unit_cost' => 0,
                'location' => 'Almacén General',
                'kontrol_type' => 'Normal',
                'is_inventoried' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // Insertar en lotes de 50
        foreach (array_chunk($insertRows, 50) as $chunk) {
            DB::table('supply_inventory_items')->insert($chunk);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('supply_inventory_items', 'part_number')) {
            Schema::table('supply_inventory_items', function (Blueprint $table) {
                $table->dropColumn('part_number');
            });
        }
    }
};
