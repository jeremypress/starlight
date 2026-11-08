import SwiftUI

@main
struct StarlightApp: App {
    var body: some Scene {
        WindowGroup {
            GameWebView()
                .ignoresSafeArea()
                .statusBarHidden()
                .persistentSystemOverlays(.hidden) // dim the home indicator
                .onAppear {
                    // Keep the screen awake — nobody touches the screen in a tilt game.
                    UIApplication.shared.isIdleTimerDisabled = true
                }
        }
    }
}
