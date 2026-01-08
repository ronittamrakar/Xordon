<?php
// Backwards-compatibility shim: alias namespaced Response to global Response if needed
if (!class_exists('\\Response') && class_exists('\\Xordon\\Response')) {
    class_alias('\\Xordon\\Response', '\\Response');
}