const fetch = require("node-fetch");

const gitHubAPI = "@api.github.com/repos/";

const user = "MaxStalker";
const pass = "==PUT-TOKEN-HERE==";
const repoOwner = "MaxStalker";
const repoName = "github-api-tester";

/* Resources */
const masterHeadRes = "/git/refs/heads/master";
const commitsRes = "/git/commits";
const treesRes = "/git/trees";

/* Main Routine*/

const getMasterData = async () => {
  const url = `https://${user}:${pass}${gitHubAPI}${repoOwner}/${repoName}${masterHeadRes}`;
  const response = await fetch(url);
  const masterBranch = await response.json();
  return masterBranch.object;
};

const getLastCommit = async (sha) => {
  const url = `https://${user}:${pass}${gitHubAPI}${repoOwner}/${repoName}${commitsRes}/${sha}`;
  const response = await fetch(url);
  const json = await response.json();
  return json.tree.sha;
};

const createNewContentTree = async (lastTreeSha, content) => {
  const url = `https://${user}:${pass}${gitHubAPI}${repoOwner}/${repoName}${treesRes}`;

  const method = "POST";
  const headers = { "Content-Type": "application/json" };
  const body = JSON.stringify({
    base_tree: lastTreeSha,
    tree: [
      {
        path: "test.cad",
        mode: "100644",
        // type: "blob",
        content,
      },
    ],
  });

  // send
  const response = await fetch(url, { method, headers, body });
  const json = await response.json();
  return json;
};

const createCommit = async (lastCommitSha, newTreeSha) => {
  const url = `https://${user}:${pass}${gitHubAPI}${repoOwner}/${repoName}${commitsRes}`;

  const method = "POST";
  const headers = { "Content-Type": "application/json" };
  const body = JSON.stringify({
    parents: [lastCommitSha],
    tree: newTreeSha,
    message: `Commit on ${new Date().toISOString()}`,
  });

  // send
  const response = await fetch(url, { method, headers, body });
  const json = await response.json();
  return json;
};

const updateRef = async (newCommitSha) => {
  const url = `https://${user}:${pass}${gitHubAPI}${repoOwner}/${repoName}${masterHeadRes}`;

  const method = "PATCH";
  const headers = { "Content-Type": "application/json" };
  const body = JSON.stringify({
    sha: newCommitSha,
    force: true, // can be changed
  });

  // send
  const response = await fetch(url, { method, headers, body });
  const json = await response.json();
  return json;
};

const getFile = async (fileName) => {
  // GET /repos/:owner/:repo/contents/:path
  const url = `https://${user}:${pass}${gitHubAPI}${repoOwner}/${repoName}/contents/${fileName}`;

  // send
  const response = await fetch(url);
  const json = await response.json();
  return json;
};

const main = async () => {
  const { sha } = await getMasterData();
  console.log({ sha });

  const lastCommit = await getLastCommit(sha);
  console.log({ lastCommit });
  const lastTreeSha = lastCommit.sha;

  const newTree = await createNewContentTree(
    lastTreeSha,
    "// Basic contract Hello world"
  );
  console.log({ newTree });

  const newTreeSha = newTree.sha;
  console.log({ newTreeSha });

  const commit = await createCommit(sha, newTreeSha);
  console.log({ commit });
  if (commit.sha) {
    const result = await updateRef(commit.sha);
    console.log({ result });
  } else {
    console.log("Commit SHA was not found...");
    return;
  }
};

const checkFile = async () => {
  const fileContents = await getFile("test.cad");
  console.log(fileContents);
};

// checkFile()

/*
const getCommits = async () => {
  console.log('Get latest commits')
  const url = `https://${user}:${pass}${gitHubAPI}${repoOwner}/${repoName}/commits?path=test.cad`;

  // send
  const response = await fetch(url);
  const json = await response.json();

  const commits = json.reduce((acc,item) => {
    const { sha, commit } = item
    acc.shas.push(sha)
    acc.messages[sha] = commit.message
    return acc
  }, {shas: [], messages: {}})
  console.log({ commits })
  //console.log({ json });
};
getCommits();
*/

const createBranch = async () => {
  const refUrl = `https://${user}:${pass}${gitHubAPI}${repoOwner}/${repoName}${masterHeadRes}`;
  const response = await fetch(refUrl);
  const json = await response.json();
  const latestCommitHash = json.object.sha;
  console.log({ latestCommitHash });

  const newRefUrl = `https://${user}:${pass}${gitHubAPI}${repoOwner}/${repoName}/git/refs`;

  // Create branch here
  const method = "POST";
  const headers = { "Content-Type": "application/json" };
  const body = JSON.stringify({
    "ref": "refs/heads/playground/test-1",
    "sha": latestCommitHash
  });
  const branchResponse = await fetch(newRefUrl, { method, headers, body });
  const branchJson = await branchResponse.json();
  console.log({ branchJson });
};

createBranch();
