import http from "http"
import { RequestHandler, serve } from "micro"

const handler: RequestHandler = () => {
  return "Welcome to Micro"
}

const server = new http.Server(serve(handler))

server.listen(8080)
