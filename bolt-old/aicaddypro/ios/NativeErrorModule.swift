import Foundation
import React

@objc(NativeErrorModule)
class NativeErrorModule: RCTEventEmitter {

  override init() {
    super.init()
  }

  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc override func supportedEvents() -> [String]! {
    return ["nativeErrorEvent"]
  }

  @objc func install() {
    // Register for error notifications from native code
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(self.handleErrorNotification(_:)),
      name: NSNotification.Name("ErrorRecoveryFailure"),
      object: nil
    )

    NotificationCenter.default.addObserver(
      self,
      selector: #selector(self.handleStartupError(_:)),
      name: NSNotification.Name("StartupProcedureError"),
      object: nil
    )

    NSLog("[NativeErrorModule] Successfully installed native error handlers")
  }

  @objc func handleErrorNotification(_ notification: Notification) {
    guard let userInfo = notification.userInfo else { return }

    // Send event to JavaScript
    let body: [String: Any] = [
      "type": "errorRecoveryFailure",
      "details": userInfo
    ]

    self.sendEvent(withName: "nativeErrorEvent", body: body)
    NSLog("[NativeErrorModule] Sent errorRecoveryFailure event to JavaScript")
  }

  @objc func handleStartupError(_ notification: Notification) {
    guard let userInfo = notification.userInfo else { return }

    // Send event to JavaScript
    let body: [String: Any] = [
      "type": "startupProcedureError",
      "details": userInfo
    ]

    self.sendEvent(withName: "nativeErrorEvent", body: body)
    NSLog("[NativeErrorModule] Sent startupProcedureError event to JavaScript")
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
  }
}
