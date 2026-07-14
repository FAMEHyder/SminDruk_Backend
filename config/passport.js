import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { getApiUrl } from "../utils/env.js";
import passport from "passport";
import User from "../models/user.model.js";
import logger from "../utils/logger.js";

/**
 * Finds an existing user by provider ID/email or creates a new one.
 * Shared by all three OAuth strategies below.
 */
const findOrCreateOAuthUser = async ({ provider, providerId, email, firstName, lastName, avatar }) => {
  let user = await User.findOne({ $or: [{ email }, { [`oauth.${provider}Id`]: providerId }] });

  if (!user) {
    user = await User.create({
      firstName,
      lastName,
      email,
      avatar,
      isEmailVerified: true,
      oauth: { [`${provider}Id`]: providerId },
    });
  } else if (!user.oauth?.[`${provider}Id`]) {
    user.oauth = { ...user.oauth, [`${provider}Id`]: providerId };
    await user.save();
  }

  return user;
};

const API_URL = getApiUrl();

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || `${API_URL}/api/v1/auth/google/callback`,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const user = await findOrCreateOAuthUser({
            provider: "google",
            providerId: profile.id,
            email: profile.emails?.[0]?.value,
            firstName: profile.name?.givenName || profile.displayName,
            lastName: profile.name?.familyName || "",
            avatar: profile.photos?.[0]?.value,
          });
          done(null, user);
        } catch (error) {
          logger.error(`Google OAuth error: ${error.message}`);
          done(error, null);
        }
      }
    )
  );
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL || `${API_URL}/api/v1/auth/github/callback`,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const user = await findOrCreateOAuthUser({
            provider: "github",
            providerId: profile.id,
            email: profile.emails?.[0]?.value || `${profile.username}@users.noreply.github.com`,
            firstName: profile.displayName || profile.username,
            lastName: "",
            avatar: profile.photos?.[0]?.value,
          });
          done(null, user);
        } catch (error) {
          logger.error(`GitHub OAuth error: ${error.message}`);
          done(error, null);
        }
      }
    )
  );
}

if (process.env.FB_APP_ID && process.env.FB_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FB_APP_ID,
        clientSecret: process.env.FB_APP_SECRET,
        callbackURL: process.env.FB_CALLBACK_URL || `${API_URL}/api/v1/auth/facebook/callback`,
        profileFields: ["id", "emails", "name", "photos"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const user = await findOrCreateOAuthUser({
            provider: "facebook",
            providerId: profile.id,
            email: profile.emails?.[0]?.value,
            firstName: profile.name?.givenName || profile.displayName,
            lastName: profile.name?.familyName || "",
            avatar: profile.photos?.[0]?.value,
          });
          done(null, user);
        } catch (error) {
          logger.error(`Facebook OAuth error: ${error.message}`);
          done(error, null);
        }
      }
    )
  );
}

export default passport;
