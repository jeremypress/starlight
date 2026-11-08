import CoreMotion
import SwiftUI
import UniformTypeIdentifiers
import WebKit

/// A full-screen WKWebView that runs the web build of the game from inside the app bundle.
struct GameWebView: UIViewRepresentable {
    static let scheme = "starlight"

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        // Serve the bundled `dist/` folder at starlight://game/... instead of file://,
        // so the page behaves like a normal website (ES modules, fetch, motion events).
        config.setURLSchemeHandler(BundleSchemeHandler(), forURLScheme: Self.scheme)
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        // Tell the page it's inside the app (before any game code runs), so it listens
        // for our CoreMotion readings instead of the browser's deviceorientation event.
        config.userContentController.addUserScript(WKUserScript(
            source: "window.starlightNative = true;",
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        ))

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.uiDelegate = context.coordinator
        webView.isOpaque = false
        webView.backgroundColor = .black
        webView.scrollView.backgroundColor = .black
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        #if DEBUG
        webView.isInspectable = true // Safari > Develop menu can attach to the app
        #endif

        webView.load(URLRequest(url: URL(string: "\(Self.scheme)://game/index.html")!))
        context.coordinator.startMotion(sendingTo: webView)
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    static func dismantleUIView(_ uiView: WKWebView, coordinator: Coordinator) {
        coordinator.stopMotion()
    }

    final class Coordinator: NSObject, WKUIDelegate {
        private let motion = CMMotionManager()

        /// Streams CoreMotion's gravity vector into the page 60 times a second.
        /// The page converts it into tilt angles (see src/input/gravityToTilt.ts).
        func startMotion(sendingTo webView: WKWebView) {
            guard motion.isDeviceMotionAvailable else { return } // e.g. the Simulator
            motion.deviceMotionUpdateInterval = 1.0 / 60.0
            motion.startDeviceMotionUpdates(to: .main) { [weak webView] data, _ in
                guard let webView, let g = data?.gravity else { return }
                let js = "window.dispatchEvent(new CustomEvent('starlight:gravity', "
                    + "{ detail: { x: \(g.x), y: \(g.y), z: \(g.z) } }))"
                webView.evaluateJavaScript(js, completionHandler: nil)
            }
        }

        func stopMotion() {
            motion.stopDeviceMotionUpdates()
        }

        // Fallback: if the page ever asks for browser motion access, grant it without a prompt.
        func webView(
            _ webView: WKWebView,
            requestDeviceOrientationAndMotionPermissionFor origin: WKSecurityOrigin,
            initiatedByFrame frame: WKFrameInfo,
            decisionHandler: @escaping (WKPermissionDecision) -> Void
        ) {
            decisionHandler(.grant)
        }
    }
}

/// Answers starlight://game/<path> requests with files from the bundled `dist` folder.
final class BundleSchemeHandler: NSObject, WKURLSchemeHandler {
    private let root = Bundle.main.resourceURL!.appendingPathComponent("dist")

    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url else { return }
        var path = url.path
        if path.isEmpty || path == "/" { path = "/index.html" }
        let fileURL = root.appendingPathComponent(path)

        // Refuse anything that escapes the dist folder (e.g. "/../").
        guard fileURL.standardizedFileURL.path.hasPrefix(root.standardizedFileURL.path),
              let data = try? Data(contentsOf: fileURL)
        else {
            let response = HTTPURLResponse(url: url, statusCode: 404, httpVersion: "HTTP/1.1", headerFields: nil)!
            task.didReceive(response)
            task.didFinish()
            return
        }

        let mime = UTType(filenameExtension: fileURL.pathExtension)?.preferredMIMEType ?? "application/octet-stream"
        let response = HTTPURLResponse(
            url: url,
            statusCode: 200,
            httpVersion: "HTTP/1.1",
            headerFields: ["Content-Type": mime, "Content-Length": String(data.count)]
        )!
        task.didReceive(response)
        task.didReceive(data)
        task.didFinish()
    }

    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {}
}
