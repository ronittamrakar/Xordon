<?php

use PHPUnit\Framework\TestCase;

class ResponseSignatureTest extends TestCase
{
    public function testResponseMethodsAreNotVoid()
    {
        require_once __DIR__ . '/../src/Response.php';

        $rc = new ReflectionClass('Xordon\\Response');
        $methodsToCheck = ['json', 'error', 'success', 'unauthorized', 'forbidden', 'notFound', 'validationError', 'serverError', 'tooManyRequests', 'text', 'startTiming'];

        foreach ($methodsToCheck as $m) {
            $this->assertTrue($rc->hasMethod($m), "Response class should declare method $m");
            $rm = $rc->getMethod($m);
            $returnType = $rm->getReturnType();
            if ($returnType !== null) {
                $this->assertNotEquals('void', $returnType->getName(), "Method $m should not have return type void");
            }
        }
    }
}
