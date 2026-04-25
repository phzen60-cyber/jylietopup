const { Octokit } = require("@octokit/rest");

exports.handler = async () => {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const owner = "phzen60-cyber";
  const repo = "jylietopup";
  const path = "harga.json";

  try {
    const { data } = await octokit.rest.repos.getContent({ owner, repo, path });
    const content = Buffer.from(data.content, 'base64').toString('utf-8');

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: content
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
