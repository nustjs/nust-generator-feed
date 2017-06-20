const nunjucks = require('nunjucks')
const env = new nunjucks.Environment()
const pathFn = require('path')
const fs = require('fs')

env.addFilter('uriencode', (str) => {
  return encodeURI(str)
})

const atomTmplSrc = pathFn.join(__dirname, 'atom.xml')
const rss2TmplSrc = pathFn.join(__dirname, 'rss2.xml')
const tpls = {
  atom: nunjucks.compile(fs.readFileSync(atomTmplSrc, 'utf8'), env),
  rss2: nunjucks.compile(fs.readFileSync(rss2TmplSrc, 'utf8'), env)
}

/**
 * generator for atom and rss2
 */
module.exports = function (data) {
  let feedConfigs = data.appConfigs.feed
  if (feedConfigs === false) return false
  let postData = data.data.posts0
  let ret = []
  Object.keys(feedConfigs).forEach(key => {
    let isDefault = key === data.appConfigs.lang
    let configs = feedConfigs[key]
    let type = configs.type || 'atom'
    let tpl = tpls[type] || tpls['atom']
    let posts = postData[key]
    if ((!posts || posts.length === 0) && configs.use_default_posts) {
      posts = postData[data.appConfigs.lang] || []
    }

    posts = posts.filter(post => {
      return post.draft !== true
    })

    if (configs.limit) posts = posts.slice(0, configs.limit - 1)

    configs.posts = posts
    configs.lastUpdated = posts[0] ? posts[0].updatedISO : new Date().toISOString()
    configs.urlRoot = data.urlRoot
    configs.author = data.appAuthor
    if (typeof configs.author === 'string') {
      configs.author = {
        name: configs.author
      }
    }
    let targetFile
    if (isDefault) {
      targetFile = pathFn.join(this.dirTheme, `static/${type}.xml`)
      configs.url = `${configs.urlRoot}${type}.xml`
    } else {
      targetFile = pathFn.join(this.dirTheme, `static/${type}-${key}.xml`)
      configs.url = `${configs.urlRoot}${type}-${key}.xml`
    }

    ret.push({
      path: targetFile,
      data: tpl.render(configs)
    })
  })
  return ret
}
