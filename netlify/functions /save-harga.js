const { Octokit } = require("@octokit/rest");

exports.handler = async (event) => {
  if (event.httpMethod!== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { GITHUB_TOKEN, REPO_OWNER, REPO_NAME } = process.env;
  const octokit = new Octokit({ auth: GITHUB_TOKEN });
  const newData = JSON.parse(event.body);

  try {
    // 1. Ambil file harga.json yang lama buat dapetin SHA
    const { data: file } = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: 'harga.json',
    });

    // 2. Update harga.json
    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: 'harga.json',
      message: `Update harga via Admin Panel - ${new Date().toLocaleString('id-ID')}`,
      content: Buffer.from(JSON.stringify(newData, null, 2)).toString('base64'),
      sha: file.sha,
    });

    // 3. Bikin backup ke folder history/
    const date = new Date().toISOString().split('T')[0];
    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: `history/harga-${date}-${Date.now()}.json`,
      message: `Backup harga ${date}`,
      content: Buffer.from(JSON.stringify(newData, null, 2)).toString('base64'),
    });

    return { statusCode: 200, body: JSON.stringify({ message: 'Berhasil save + backup' }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
