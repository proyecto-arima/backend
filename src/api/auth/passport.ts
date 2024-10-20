import passport from 'passport';
import { Profile, Strategy as GoogleStrategy } from 'passport-google-oauth20';

import { userRepository } from '@/api/user/userRepository';
import { config } from '@/common/utils/config';

import { authService } from './authService';

passport.use(
  new GoogleStrategy(
    {
      clientID: config.googleAuth.clientId,
      clientSecret: config.googleAuth.clientSecret,
      callbackURL: `${config.googleAuth.callbackUrlHost}`,
    },
    async (accessToken, refreshToken, profile: Profile, done) => {
      try {
        const user = await authService.loginWithGoogle(profile);
        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await userRepository.findByIdAsync(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
