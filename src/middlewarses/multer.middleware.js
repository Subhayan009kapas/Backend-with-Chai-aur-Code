import multer from "multer"

const storage = multer.diskStorage({

                 // set the file destination 
          destination: function (req, file, cb) { 

            cb(null, './public/temp')
          },

              // set the name of the file  in ./public/temp
          filename: function (req, file, cb) {
           
            cb(null, file.originalname)
          }
        })
        
      export  const upload = multer({ 
          storage,
 })