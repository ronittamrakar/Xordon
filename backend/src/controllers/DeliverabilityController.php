<?php
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../services/WarmupService.php';
require_once __DIR__ . '/../services/DnsVerificationService.php';

class DeliverabilityController {
    private static ?WarmupService $warmupService = null;
    private static ?DnsVerificationService $dnsService = null;

    private static function warmup(): WarmupService {
        if (!self::$warmupService) {
            self::$warmupService = new WarmupService();
        }
        return self::$warmupService;
    }

    private static function dns(): DnsVerificationService {
        if (!self::$dnsService) {
            self::$dnsService = new DnsVerificationService();
        }
        return self::$dnsService;
    }

    public static function accounts(): void {
        $userId = Auth::userIdOrFail();
        try {
            $items = self::warmup()->getAccountSummary($userId);
            Response::json(['items' => $items]);
        } catch (Throwable $e) {
            Response::serverError('Failed to load deliverability overview', $e);
        }
    }

    public static function createProfile(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        try {
            $profile = self::warmup()->upsertProfile($userId, $body);
            Response::json(['profile' => $profile], 201);
        } catch (InvalidArgumentException $e) {
            Response::validationError($e->getMessage());
        } catch (Throwable $e) {
            Response::serverError('Failed to create warmup profile', $e);
        }
    }

    public static function updateProfile(string $id): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $profileId = (int)$id;
        try {
            if ($profileId <= 0) {
                throw new InvalidArgumentException('Invalid profile ID');
            }
            $profile = self::warmup()->updateProfile($userId, $profileId, $body);
            Response::json(['profile' => $profile]);
        } catch (InvalidArgumentException $e) {
            Response::validationError($e->getMessage());
        } catch (Throwable $e) {
            Response::serverError('Failed to update warmup profile', $e);
        }
    }

    public static function pauseProfile(string $id): void {
        self::toggleProfilePause($id, true);
    }

    public static function resumeProfile(string $id): void {
        self::toggleProfilePause($id, false);
    }

    private static function toggleProfilePause(string $id, bool $paused): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $profileId = (int)$id;
        try {
            if ($profileId <= 0) {
                throw new InvalidArgumentException('Invalid profile ID');
            }
            $reason = $paused ? ($body['reason'] ?? null) : null;
            $profile = self::warmup()->setPauseStatus($userId, $profileId, $paused, $reason);
            Response::json(['profile' => $profile]);
        } catch (InvalidArgumentException $e) {
            Response::validationError($e->getMessage());
        } catch (Throwable $e) {
            Response::serverError('Failed to update warmup status', $e);
        }
    }

    public static function scheduleRuns(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $day = isset($body['run_date']) ? (string)$body['run_date'] : null;
        try {
            $scheduled = self::warmup()->scheduleDailyRuns($userId, $day);
            Response::json([
                'scheduled' => $scheduled,
                'run_date' => $day ? date('Y-m-d', strtotime($day)) : date('Y-m-d'),
            ]);
        } catch (Throwable $e) {
            Response::serverError('Failed to schedule warmup runs', $e);
        }
    }

    public static function checkDns(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $domain = $body['domain'] ?? null;
        $selector = $body['dkim_selector'] ?? null;
        try {
            if (!$domain) {
                throw new InvalidArgumentException('Domain is required');
            }
            $result = self::dns()->checkDomain($userId, $domain, [
                'dkim_selector' => $selector,
            ]);
            Response::json($result);
        } catch (InvalidArgumentException $e) {
            Response::validationError($e->getMessage());
        } catch (Throwable $e) {
            Response::serverError('Failed to verify DNS records', $e);
        }
    }
}
