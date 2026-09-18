<?php namespace ProcessWire;
/** Run: php tests/process-input.php /path/to/processwire [module-file] */
if(PHP_SAPI !== 'cli') exit;
$root = $argv[1] ?? getcwd();
require rtrim($root, '/') . '/wire/core/ProcessWire.php';
$config = ProcessWire::buildConfig($root);
$wire = new ProcessWire($config, '/', false); // No database or site autoload modules.
require $argv[2] ?? dirname(__DIR__) . '/InputfieldPageModalSelect.module';

$cases = array(
 'select one' => array(array(), array('123'), array(123)),
 'keep one' => array(array(123), array('123'), array(123)),
 'replace one' => array(array(123), array('456'), array(456)),
 'select several' => array(array(), array('123,456'), array(123, 456)),
 'keep several' => array(array(123, 456), array('123,456'), array(123, 456)),
 'remove one' => array(array(123, 456), array('456'), array(456)),
 'reorder' => array(array(123, 456), array('456,123'), array(456, 123)),
 'clear' => array(array(123), array(''), array()),
 'keep empty' => array(array(), array(''), array()),
 'missing' => array(array(123), null, array()),
 'integer' => array(array(), array(123), array(123)),
 'array of IDs' => array(array(), array('123', '456'), array(123, 456)),
 'sanitize' => array(array(), array('123,0,-1,456,123'), array(123, 456)),
);
$failures = 0;
$checks = 0;
foreach(array('transcripts', 'transcripts_repeater1234', 'transcripts_repeater5678') as $name) {
 foreach($cases as $label => list($previous, $posted, $expected)) {
  $field = $wire->wire(new InputfieldPageModalSelect());
  $field->init();
  $field->name = $name;
  $field->val($previous);
  $wrapper = $wire->wire(new InputfieldWrapper());
  $wrapper->add($field);
  $wrapper->resetTrackChanges(true);
  $data = array('unrelated_repeater999' => array('789'));
  if($posted !== null) $data[$name] = $posted;
  $input = $wire->wire(new WireInputData($data));
  $before = $input->getArray();
  $wrapper->processInput($input);
  $changed = $previous !== $expected;
  $ok = $field->val() === $expected && $field->isChanged('value') === $changed
   && $input->getArray() === $before;
  $checks++;
  if(!$ok) {
   $failures++;
   echo "FAIL $name / $label: " . json_encode(array('value' => $field->val(), 'changed' => $field->isChanged('value'))) . "\n";
  }
 }
}
echo "$checks cases, $failures failures\n";
exit($failures ? 1 : 0);
