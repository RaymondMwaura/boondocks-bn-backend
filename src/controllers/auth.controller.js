/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-unused-vars */
import db from '../models';
import JWTToken from '../utils/jwt';

export const getTokenAfterSignIn = async (res, user) => {
  const userDetails = user.dataValues;
  const token = await JWTToken.signToken(userDetails);
  const { twoFASecret, twoFAType, twoFADataURL } = userDetails;
  let authRoute = '/home';
  if (twoFAType === 'sms_text' || twoFAType === 'authenticator_app') {
    authRoute = '/login-2-fa';
  }
  const redirectURL = `${process.env.FRONTEND_URL}${authRoute}?token=${token}&twoFASecret=${twoFASecret}&twoFAType=${twoFAType}&twoFADataURL=${twoFADataURL}`;
  return res.redirect(redirectURL);
};

/** Auth Class */
class AuthController {
  /**
   * facebookSignIn
   *
   * @param {object} req - request object
   * @param {object} res - response object
   *
   * @returns {object} - object containing a user object and token
   * @memberof AuthController
   *
   */
  async facebookSignIn(req, res) {
    const { first_name, last_name, email } = req.user._json;
    await db.user.findOrCreate({
      where: { email },
      defaults: {
        firstName: first_name,
        lastName: last_name,
        email,
        isVerified: true,
      },
    }).spread((user$, isCreated) => getTokenAfterSignIn(res, user$));
  }

  /**
   * googleSignIn
   *
   * @param {object} req - request object
   * @param {object} res - response object
   *
   * @returns {object} - object containing a user object and token
   * @memberof AuthController
   */
  async googleSignIn(req, res) {
    const { displayName, emails } = req.user;
    await db.user.findOrCreate({
      where: { email: emails[0].value },
      defaults: {
        firstName: displayName.split(' ')[0],
        lastName: displayName.split(' ')[1],
        email: emails[0].value,
        isVerified: true,
      },
    }).spread((user, isCreated) => getTokenAfterSignIn(res, user));
  }
}

export default new AuthController();
