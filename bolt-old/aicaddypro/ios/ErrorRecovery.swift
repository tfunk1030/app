import Foundation

/**
 * ErrorRecoveryDelegate protocol defines methods that must be implemented by
 * any class that wants to handle error recovery operations.
 */
protocol ErrorRecoveryDelegate {
    func throwException(_ message: String)
    func proceedWithoutCache() // New method for graceful recovery
}

/**
 * ErrorRecovery class handles cache recovery operations and error handling
 * during app startup.
 */
class ErrorRecovery {
    // Reference to the delegate that will handle exceptions or recovery
    private let delegate: ErrorRecoveryDelegate

    // Initialize with a delegate
    init(delegate: ErrorRecoveryDelegate) {
        self.delegate = delegate
    }

    /**
     * Attempts to relaunch the app using cached data. If the cache is corrupted
     * or incompatible, it will recover gracefully instead of crashing.
     */
    func tryRelaunchFromCache() {
        NSLog("[ErrorRecovery] Attempting to relaunch from cache")

        // Run tasks in background to avoid blocking UI
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self = self else { return }

            // Perform cache validation
            if !self.validateCacheIntegrity() {
                NSLog("[ErrorRecovery] Cache validation failed, using default startup")
                self.recoverFromFailedCacheRelaunch()
                return
            }

            // Try to load and apply cache
            do {
                try self.loadAndApplyCachedState()

                // Notify JavaScript that cache was successfully loaded
                DispatchQueue.main.async {
                    NotificationCenter.default.post(
                        name: NSNotification.Name("CacheRelaunchSuccess"),
                        object: nil
                    )
                }
            } catch {
                NSLog("[ErrorRecovery] Failed to apply cached state: \(error.localizedDescription)")
                self.recoverFromFailedCacheRelaunch()
            }
        }
    }

    /**
     * Run the next task in the recovery sequence
     */
    func runNextTask() {
        NSLog("[ErrorRecovery] Running next recovery task")

        // This is a simplified example - in a real implementation,
        // this would manage a queue of recovery tasks
        do {
            // Try to execute next recovery task
            try executeNextRecoveryTask()
        } catch {
            NSLog("[ErrorRecovery] Error in recovery task: \(error.localizedDescription)")

            // Instead of crashing, handle the error gracefully
            if error is CacheRecoveryError {
                handleCacheRecoveryError(error as! CacheRecoveryError)
            } else {
                // For other errors that would have previously crashed, call our safer method
                crash()
            }
        }
    }

    /**
     * Previously this method would crash the app by throwing an exception
     * Now it reports the error and recovers gracefully
     */
    func crash() {
        #if DEBUG
            // In debug builds, allow exceptions for easier debugging
            if ProcessInfo.processInfo.environment["ALLOW_EXCEPTIONS"] == "true" {
                delegate.throwException("Error occurred during cache relaunch")
                return
            }
        #endif

        // Log error but don't crash in production
        NSLog("[ErrorRecovery] Error occurred during cache relaunch, recovering gracefully")

        // Send error to analytics instead of crashing
        let errorInfo = ["location": "ErrorRecovery.crash",
                        "context": "Cache relaunch",
                        "timestamp": Date().timeIntervalSince1970] as [String: Any]
        NotificationCenter.default.post(name: NSNotification.Name("ErrorRecoveryFailure"),
                                        object: nil,
                                        userInfo: errorInfo)

        // Clean up any corrupted state
        clearCacheState()

        // Continue execution without crashing
        delegate.proceedWithoutCache()
    }

    /**
     * Clear any corrupted cache state
     */
    private func clearCacheState() {
        // Remove cache files that might be corrupted
        let cacheURL = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first
        let appCacheURL = cacheURL?.appendingPathComponent("app-cache-data")

        if let url = appCacheURL, FileManager.default.fileExists(atPath: url.path) {
            do {
                try FileManager.default.removeItem(at: url)
                NSLog("[ErrorRecovery] Successfully cleared cache state")
            } catch {
                NSLog("[ErrorRecovery] Failed to clear cache state: \(error.localizedDescription)")
            }
        }
    }

    // MARK: - Helper methods

    private func validateCacheIntegrity() -> Bool {
        // Implement cache validation logic
        // This would check if cache files exist and have valid format
        return true // For this example
    }

    private func loadAndApplyCachedState() throws {
        // Implementation would load cached data and apply it to app state
        // Throw errors if cache is corrupted or incompatible
    }

    private func executeNextRecoveryTask() throws {
        // Implementation would execute the next task in recovery sequence
        // Throw errors if task fails
    }

    private func recoverFromFailedCacheRelaunch() {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.delegate.proceedWithoutCache()
        }
    }

    private func handleCacheRecoveryError(_ error: CacheRecoveryError) {
        NSLog("[ErrorRecovery] Handling cache recovery error: \(error.errorCode)")
        // Handle specific cache recovery error types
        clearCacheState()
        delegate.proceedWithoutCache()
    }
}

// Custom error type for cache recovery issues
enum CacheRecoveryError: Error {
    case corrupted(String)
    case incompatible(String)
    case notFound

    var errorCode: String {
        switch self {
        case .corrupted: return "corrupted_cache"
        case .incompatible: return "incompatible_cache"
        case .notFound: return "cache_not_found"
        }
    }
}
