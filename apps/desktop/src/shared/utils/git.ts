/**
 * Git 相关工具函数
 */

/**
 * 验证 Git 仓库 URL 是否有效
 * 支持的格式：
 * - HTTPS: https://github.com/user/repo.git
 * - HTTP: http://github.com/user/repo.git  
 * - SSH: git@github.com:user/repo.git
 * - SSH with ssh://: ssh://git@github.com/user/repo.git
 * - GitHub CLI: gh:user/repo
 * 
 * @param url Git 仓库 URL
 * @returns 是否为有效的 Git URL
 */
export function isValidGitUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }

  const trimmedUrl = url.trim()
  
  // HTTPS/HTTP 格式
  const httpsPattern = /^https?:\/\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]+\.git$/
  if (httpsPattern.test(trimmedUrl)) {
    return true
  }

  // SSH 格式: git@hostname:path/repo.git
  const sshPattern = /^git@[a-zA-Z0-9\-._]+:[a-zA-Z0-9\-._\/]+\.git$/
  if (sshPattern.test(trimmedUrl)) {
    return true
  }

  // SSH with ssh:// 格式: ssh://git@hostname/path/repo.git
  const sshUrlPattern = /^ssh:\/\/git@[a-zA-Z0-9\-._]+\/[a-zA-Z0-9\-._\/]+\.git$/
  if (sshUrlPattern.test(trimmedUrl)) {
    return true
  }

  // GitHub CLI 格式: gh:user/repo
  const githubCliPattern = /^gh:[a-zA-Z0-9\-._]+\/[a-zA-Z0-9\-._]+$/
  if (githubCliPattern.test(trimmedUrl)) {
    return true
  }

  // 通用 Git URL 格式检查（包含 .git 结尾的其他格式）
  const generalGitPattern = /\.git$/
  if (generalGitPattern.test(trimmedUrl)) {
    // 进一步检查是否包含合理的主机名和路径
    const hasValidFormat = /^[a-zA-Z][a-zA-Z0-9\-+.]*:\/\//.test(trimmedUrl) || 
                          /^[a-zA-Z0-9\-._]+@[a-zA-Z0-9\-._]+:/.test(trimmedUrl)
    return hasValidFormat
  }

  return false
}

/**
 * 从 Git URL 中提取仓库信息
 * 
 * @param url Git 仓库 URL
 * @returns 仓库信息对象，包含主机名、用户名、仓库名等
 */
export function parseGitUrl(url: string) {
  const trimmedUrl = url.trim()

  // SSH 格式: git@github.com:user/repo.git
  const sshMatch = trimmedUrl.match(/^git@([^:]+):([^\/]+)\/(.+)\.git$/)
  if (sshMatch) {
    return {
      protocol: 'ssh',
      host: sshMatch[1],
      owner: sshMatch[2],
      repo: sshMatch[3],
      fullName: `${sshMatch[2]}/${sshMatch[3]}`
    }
  }

  // HTTPS/HTTP 格式: https://github.com/user/repo.git
  const httpsMatch = trimmedUrl.match(/^(https?):\/\/([^\/]+)\/([^\/]+)\/(.+)\.git$/)
  if (httpsMatch) {
    return {
      protocol: httpsMatch[1],
      host: httpsMatch[2],
      owner: httpsMatch[3],
      repo: httpsMatch[4],
      fullName: `${httpsMatch[3]}/${httpsMatch[4]}`
    }
  }

  // SSH with ssh:// 格式: ssh://git@github.com/user/repo.git
  const sshUrlMatch = trimmedUrl.match(/^ssh:\/\/git@([^\/]+)\/([^\/]+)\/(.+)\.git$/)
  if (sshUrlMatch) {
    return {
      protocol: 'ssh',
      host: sshUrlMatch[1],
      owner: sshUrlMatch[2],
      repo: sshUrlMatch[3],
      fullName: `${sshUrlMatch[2]}/${sshUrlMatch[3]}`
    }
  }

  return null
}

/**
 * 生成不同格式的 Git URL
 * 
 * @param host 主机名 (如 github.com)
 * @param owner 用户/组织名
 * @param repo 仓库名
 * @returns 不同格式的 Git URL
 */
export function generateGitUrls(host: string, owner: string, repo: string) {
  return {
    https: `https://${host}/${owner}/${repo}.git`,
    ssh: `git@${host}:${owner}/${repo}.git`,
    sshUrl: `ssh://git@${host}/${owner}/${repo}.git`
  }
}

/**
 * 获取常用的 Git 仓库地址示例
 */
export function getGitUrlExamples() {
  return [
    'https://github.com/username/repository.git',
    'git@github.com:username/repository.git',
    'https://gitlab.com/username/repository.git',
    'git@gitlab.com:username/repository.git',
    'ssh://git@github.com/username/repository.git'
  ]
}