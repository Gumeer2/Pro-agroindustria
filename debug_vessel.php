$vessels = App\Models\Vessel::where('name', 'like', '%Nord%')->get();
foreach($vessels as $v) {
echo "ID: " . $v->id . "\n";
echo "Name: " . $v->name . "\n";
echo "Dock: " . ($v->dock ?? 'NULL') . "\n";
echo "ETB: " . ($v->etb ?? 'NULL') . "\n";
echo "Berthal: " . ($v->berthal_datetime ?? 'NULL') . "\n";
echo "Departure: " . ($v->departure_date ?? 'NULL') . "\n";
echo "----------------\n";
}