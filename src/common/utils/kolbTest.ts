import { LearningProfile } from '@/common/models/learningProfile';

export function calculateLearningProfile(answers: number[][]): LearningProfile {
  const EC = answers.reduce((sum, res) => sum + res[0], 0);
  const OR = answers.reduce((sum, res) => sum + res[1], 0);
  const CA = answers.reduce((sum, res) => sum + res[2], 0);
  const EA = answers.reduce((sum, res) => sum + res[3], 0);

  const distancias: Record<LearningProfile, number> = {
    [LearningProfile.DIVERGENTE]: Math.sqrt(Math.pow(OR, 2) + Math.pow(EC, 2)),
    [LearningProfile.ASIMILADOR]: Math.sqrt(Math.pow(OR, 2) + Math.pow(CA, 2)),
    [LearningProfile.ACOMODADOR]: Math.sqrt(Math.pow(EA, 2) + Math.pow(EC, 2)),
    [LearningProfile.CONVERGENTE]: Math.sqrt(Math.pow(EA, 2) + Math.pow(CA, 2)),
  };

  const maxDistancia = Math.max(...Object.values(distancias));
  const perfilesEmpatados = Object.keys(distancias).filter(
    (perfil) => distancias[perfil as LearningProfile] === maxDistancia
  ) as LearningProfile[];

  // Si hay empate, elige un perfil aleatoriamente
  const profile = perfilesEmpatados[Math.floor(Math.random() * perfilesEmpatados.length)];

  return profile;
}
