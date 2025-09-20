import { isValidGitUrl, parseGitUrl, generateGitUrls } from './git'

describe('Git utilities', () => {
  describe('isValidGitUrl', () => {
    test('validates HTTPS URLs', () => {
      expect(isValidGitUrl('https://github.com/user/repo.git')).toBe(true)
      expect(isValidGitUrl('https://gitlab.com/user/repo.git')).toBe(true)
      expect(isValidGitUrl('http://example.com/user/repo.git')).toBe(true)
    })

    test('validates SSH URLs', () => {
      expect(isValidGitUrl('git@github.com:user/repo.git')).toBe(true)
      expect(isValidGitUrl('git@gitlab.com:user/repo.git')).toBe(true)
      expect(isValidGitUrl('git@example.com:user/repo.git')).toBe(true)
    })

    test('validates SSH with ssh:// protocol', () => {
      expect(isValidGitUrl('ssh://git@github.com/user/repo.git')).toBe(true)
      expect(isValidGitUrl('ssh://git@gitlab.com/user/repo.git')).toBe(true)
    })

    test('validates specific case: git@github.com:imeepos/sker-di.git', () => {
      expect(isValidGitUrl('git@github.com:imeepos/sker-di.git')).toBe(true)
    })

    test('rejects invalid URLs', () => {
      expect(isValidGitUrl('')).toBe(false)
      expect(isValidGitUrl('not-a-url')).toBe(false)
      expect(isValidGitUrl('https://github.com/user/repo')).toBe(false) // missing .git
      expect(isValidGitUrl('git@github.com')).toBe(false) // incomplete
    })
  })

  describe('parseGitUrl', () => {
    test('parses SSH URLs', () => {
      const result = parseGitUrl('git@github.com:imeepos/sker-di.git')
      expect(result).toEqual({
        protocol: 'ssh',
        host: 'github.com',
        owner: 'imeepos',
        repo: 'sker-di',
        fullName: 'imeepos/sker-di'
      })
    })

    test('parses HTTPS URLs', () => {
      const result = parseGitUrl('https://github.com/imeepos/sker-di.git')
      expect(result).toEqual({
        protocol: 'https',
        host: 'github.com',
        owner: 'imeepos',
        repo: 'sker-di',
        fullName: 'imeepos/sker-di'
      })
    })

    test('returns null for invalid URLs', () => {
      expect(parseGitUrl('invalid-url')).toBe(null)
      expect(parseGitUrl('')).toBe(null)
    })
  })

  describe('generateGitUrls', () => {
    test('generates different formats for a repository', () => {
      const result = generateGitUrls('github.com', 'imeepos', 'sker-di')
      expect(result).toEqual({
        https: 'https://github.com/imeepos/sker-di.git',
        ssh: 'git@github.com:imeepos/sker-di.git',
        sshUrl: 'ssh://git@github.com/imeepos/sker-di.git'
      })
    })
  })
})