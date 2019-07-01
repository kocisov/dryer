#!/usr/bin/env node

const { homedir } = require('os')
const { resolve } = require('path')
const { clipanion } = require('clipanion')
const { execSync } = require('child_process')
const { symlinkSync, readlinkSync, existsSync, mkdirSync } = require('fs')

const home = homedir()
const dryeFiles = resolve(home, '.drye')

function getSymLink() {
  let symlink

  try {
    const realPath = process.env.PWD
    symlink = readlinkSync(realPath)
  } catch (e) {
    console.log('You are currently not in any project folder.')
    process.exit()
  }

  return symlink
}

clipanion
  .command(`add <dependency> [...dependencies]`)
  .describe(`Install new dependencies.`)
  .action(({ dependency, dependencies }) => {
    const symlink = getSymLink()

    execSync(`yarn add ${dependency} ${dependencies.join(' ')}`, {
      cwd: symlink,
      stdio: 'inherit'
    })
  })

clipanion
  .command(`run <command>`)
  .describe(`Run command.`)
  .action(({ command }) => {
    const symlink = getSymLink()

    execSync(`yarn ${command}`, {
      cwd: symlink,
      stdio: 'inherit'
    })
  })

clipanion
  .command(`create <name>`)
  .describe(`Create new project.`)
  .action(({ name: projectName }) => {
    const projectFolder = resolve(dryeFiles, projectName)

    if (!existsSync(dryeFiles)) {
      mkdirSync(dryeFiles)
    }

    execSync(`create-react-app ${projectName}`, {
      cwd: dryeFiles
    })

    symlinkSync(resolve(projectFolder, 'src'), resolve(cwd, projectName))

    console.log(`Real project folder @ ${projectFolder}`)
    console.log(`> cd ${projectFolder}`)
  })

clipanion.runExit(process.argv0, process.argv.slice(2))
