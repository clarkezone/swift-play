import Vapor


class WebsocketClients {
    var foo: [WebSocket] = [WebSocket]()
    
    init(eventLoop: EventLoop) {
        
    }
    
    func connect(_ ws: WebSocket) {
        ws.onText(handleReceive)
        //onClose
        foo.append(ws)
    }
    
    func sendToAll(_ txt: String) {
        foo.forEach{
         dest in
            dest.send(txt)
        }
    }
    
    func handleReceive(ws: WebSocket, str: String){
//        if str=="requestplay"{
//            sendToAll("doplay")
 //       }
        sendToAll(str)
    }
    
    func handleClose() {}
}

// configures your application
public func configure(_ app: Application) async throws {
    // uncomment to serve files from /Public folder
    app.middleware.use(FileMiddleware(publicDirectory: app.directory.publicDirectory))
    let clients = WebsocketClients(eventLoop: app.eventLoopGroup.next())

       app.webSocket("channel") { req, ws in
           clients.connect(ws)
       }
    
    // register routes
    try routes(app)
}
