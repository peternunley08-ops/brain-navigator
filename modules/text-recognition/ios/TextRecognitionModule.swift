import ExpoModulesCore
import UIKit
import Vision

// Reads the text in an image on the device with Apple's Vision framework.
// Used to import classes and due dates from a screenshot — nothing is
// uploaded anywhere. Returns one entry per line of text, with its box in
// 0–1 coordinates measured from the top-left.
public class TextRecognitionModule: Module {
  public func definition() -> ModuleDefinition {
    Name("TextRecognition")

    AsyncFunction("recognize") { (uri: String, promise: Promise) in
      let url: URL? = uri.contains("://") ? URL(string: uri) : URL(fileURLWithPath: uri)
      guard let url = url,
            let data = try? Data(contentsOf: url),
            let image = UIImage(data: data),
            let cgImage = image.cgImage else {
        promise.reject("E_IMAGE", "Couldn't open that image.")
        return
      }

      let request = VNRecognizeTextRequest { request, error in
        if let error = error {
          promise.reject("E_RECOGNIZE", error.localizedDescription)
          return
        }
        let observations = (request.results as? [VNRecognizedTextObservation]) ?? []
        let lines: [[String: Any]] = observations.compactMap { observation in
          guard let best = observation.topCandidates(1).first else { return nil }
          let box = observation.boundingBox
          return [
            "text": best.string,
            "confidence": best.confidence,
            "x": box.origin.x,
            "y": 1 - box.origin.y - box.size.height,
            "width": box.size.width,
            "height": box.size.height,
          ]
        }
        promise.resolve(lines)
      }
      request.recognitionLevel = .accurate
      request.usesLanguageCorrection = true

      let handler = VNImageRequestHandler(
        cgImage: cgImage,
        orientation: CGImagePropertyOrientation(image.imageOrientation),
        options: [:]
      )
      DispatchQueue.global(qos: .userInitiated).async {
        do {
          try handler.perform([request])
        } catch {
          promise.reject("E_RECOGNIZE", error.localizedDescription)
        }
      }
    }
  }
}

extension CGImagePropertyOrientation {
  init(_ orientation: UIImage.Orientation) {
    switch orientation {
    case .up: self = .up
    case .upMirrored: self = .upMirrored
    case .down: self = .down
    case .downMirrored: self = .downMirrored
    case .left: self = .left
    case .leftMirrored: self = .leftMirrored
    case .right: self = .right
    case .rightMirrored: self = .rightMirrored
    @unknown default: self = .up
    }
  }
}
