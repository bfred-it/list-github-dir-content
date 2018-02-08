const fetch = require('node-fetch'); // Automatically excluded in browser bundles

const defaultRef = 'master';

// Great for downloads with few sub directories on big repos
// Cons: many requests if the repo has a lot of nested dirs
async function viaContentsApi(repo, dir, token, ref = defaultRef) {
	const files = [];
	const requests = [];
	const response = await fetch(`https://api.github.com/repos/${repo}/contents/${dir}?access_token=${token}&ref=${ref}`);
	const contents = await response.json();
	for (const item of contents) {
		if (item.type === 'file') {
			files.push(item.path);
		} else if (item.type === 'dir') {
			requests.push(viaContentsApi(repo, item.path, token, ref));
		}
	}
	return files.concat(...await Promise.all(requests));
}

// Great for downloads with many sub directories
// Pros: one request + maybe doesn't require token
// Cons: huge on huge repos + may be truncated and has to fallback to viaContentsApi
async function viaTreesApi(repo, dir, token, ref = defaultRef) {
	const files = [];
	const response = await fetch(`https://api.github.com/repos/${repo}/git/trees/${ref}?recursive=1&access_token=${token}`);
	const contents = await response.json();
	for (const item of contents.tree) {
		if (item.type === 'blob' && item.path.startsWith(dir)) {
			files.push(item.path);
		}
	}
	files.truncated = contents.truncated;
	return files;
}

module.exports.viaContentsApi = viaContentsApi;
module.exports.viaContentApi = viaContentsApi;
module.exports.viaTreesApi = viaTreesApi;
module.exports.viaTreeApi = viaTreesApi;
