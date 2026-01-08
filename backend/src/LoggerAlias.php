<?php
// Backwards-compatibility shim: alias namespaced Logger to global Logger if needed
if (!class_exists('\\Logger') && class_exists('\\Xordon\\Logger')) {
    class_alias('\\Xordon\\Logger', '\\Logger');
}