import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner: "phzen60-cyber",
      repo: "jylietopup", 
      path: "harga.json"
    });
    
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(content);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
