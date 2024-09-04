import { Router } from "express";
import { loginUser, logoutUser, registerUser  , refreshAccessToken} from "../controllers/user.controller.js";
import { upload } from "../middlewarses/multer.middleware.js";
import { verifyJWT } from "../middlewarses/auth.middlewares.js";

const router = Router()

router.route("/register").post(
          upload.fields([
                    {
                              name:"avatar",
                              maxCount:1
                    },
                    {
                              name:"coverImage",
                              maxCount:1,

                    }

          ]),
          registerUser
)

router.route("/login").post(loginUser)

//secured routes (Logout)
router.route("/logout").post(verifyJWT,logoutUser)

// Generate refresh Token
router.route("/refresh-token").post(refreshAccessToken)

export default router  