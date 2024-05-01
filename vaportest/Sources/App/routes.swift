import Vapor



func routes(_ app: Application) throws {
    app.get { req async in
        "It works!"
    }

    app.get("hello") { req async -> String in
        "Hello, world!"
    }
    
//    app.webSocket("echo") { req, ws in
//        // Connected WebSocket.
//        print(ws)
//        
//        ws.onText { ws, text in
//            // String received by this WebSocket.
//            print(text)
//            ws.send("hello back")
//        }
//    }
    
}
