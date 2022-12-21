import { initializeApp, cert } from "firebase-admin/app"
import { getStorage } from "firebase-admin/storage"
import { Server } from "http"
import { serve } from "micro"
import { config } from "dotenv"
import { tmpdir } from "os"
import sharp from "sharp"

config()

const projectId = process.env.GOOGLE_PROJECT_ID + ""

const clientEmail = process.env.GOOGLE_CLIENT_EMAIL + ""

const privateKey = process.env.GOOGLE_PRIVATE_KEY + ""

initializeApp({
  credential: cert({
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n").replace(/\\/g, ""),
    projectId,
  }),
  storageBucket: `${projectId}.appspot.com`,
})

const handler = async (req, resp) => {
  const [paramsText = "", searchParamsText = ""] = req.url.split("?")

  const [, fileId = ""] = paramsText.split("/")

  if (fileId.includes(".")) {
    return null
  }

  if (fileId.length !== 20) {
    return null
  }

  const search = new URLSearchParams(searchParamsText)

  const width = parseInt(search.get("w") || "512")

  const height = parseInt(search.get("h") || "0") || null

  const quality = parseInt(search.get("q") || "100")

  resp.setHeader("Cache-control", "public, max-age=86400")

  resp.setHeader("Content-Type", "image/png")

  const fileName = `${fileId}.${width}.${height}.${quality}`

  const tmpPath = `${tmpdir()}/${fileName}`

  try {
    const buffer = await sharp(tmpPath).toBuffer()
    return buffer
  } catch (error) {
    error
  }

  const bucket = getStorage().bucket()

  const [file] = await bucket.file(fileId).download({
    validation: false,
  })

  const resizedImage = sharp(file).resize({
    width: width,
    height: height ?? undefined,
    fit: height !== null ? sharp.fit.cover : undefined,
  })

  const sharpImage = resizedImage.png({ quality })

  const buffer = await sharpImage.toBuffer()

  await sharpImage.toFile(tmpPath)

  return buffer
}

const server = new Server(serve(handler))

server.listen(3000)
