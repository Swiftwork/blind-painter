import { Words } from 'server/words';
import { NextApiRequest, NextApiResponse } from 'next';

const words = new Words();

export default async (req: NextApiRequest, res: NextApiResponse) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(await words.getCategories()));
};
