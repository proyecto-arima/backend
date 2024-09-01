import cron from 'node-cron';

import { ContentModel } from '@/api/course/content/contentModel';

// Ejecuta el job cada minuto (puedes ajustar la frecuencia según tus necesidades)
cron.schedule('* * * * *', async () => {
  console.log('Checking for contents to update visibility...');

  const now = new Date();
  const contentsToUpdate = await ContentModel.updateMany(
    {
      publicationDate: { $lte: now },
      visible: false,
    },
    { visible: true }
  );

  if (contentsToUpdate.modifiedCount > 0) {
    console.log(`${contentsToUpdate.modifiedCount} content(s) visibility updated.`);
  } else {
    console.log('No contents to update.');
  }
});
