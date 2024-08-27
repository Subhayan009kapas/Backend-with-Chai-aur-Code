import multer from "multer"

const storage = multer.diskStorage({    // disckstorage ,, not using memory storage as may load on memory  
    destination: function (req, file, cb) {    
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)   // as this file will be stored in the local for a tiny amount of time same name may be tolarated ......
    }
  })
  
  export const upload = multer({ storage })