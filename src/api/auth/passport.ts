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
      callbackURL: `${config.googleAuth.callbackUrl}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile: Profile, done) => {
      try {
        // Utilizamos el método loginWithGoogle del servicio para buscar el usuario
        const user = await authService.loginWithGoogle(profile);

        // Si el usuario existe, lo pasamos a Passport
        return done(null, user);
      } catch (err) {
        // Si ocurre un error o no se encuentra el usuario, devolvemos el error
        return done(err, false); // Pasa 'false' en lugar de 'null' cuando no hay usuario
      }
    }
  )
);

// Serializar y deserializar el usuario
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
