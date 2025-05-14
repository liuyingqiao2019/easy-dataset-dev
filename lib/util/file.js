import { createHash } from 'crypto';
import { createReadStream } from 'fs';

export async function getFileMD5(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash('md5');
    const stream = createReadStream(filePath);

    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

export function filterDomainTree(tree = []) {
  for (let i = 0; i < tree.length; i++) {
    const { child } = tree[i];
    delete tree[i].id;
    delete tree[i].projectId;
    delete tree[i].parentId;
    delete tree[i].questionCount;
    filterDomainTree(child);
  }
  return tree;
}
