import Vapor
import Logging

@main
enum Entrypoint {
    static func main() async throws {
        var env = try Environment.detect()
        try LoggingSystem.bootstrap(from: &env)
        
        let app = Application(env)
      
        defer { app.shutdown() }
        
        do {
            try await configure(app)
        } catch {
            app.logger.report(error: error)
            throw error
        }
        //app.http.server.configuration.address = BindAddress.unixDomainSocket(path: "0.0.0.0")
        //app.http.server.configuration.hostname = "0.0.0.0"

        try await app.execute()
    }
}
