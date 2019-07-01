#!/usr/bin/env node

const ora = require('ora')
const rimraf = require('rimraf')
const { homedir } = require('os')
const { resolve, basename } = require('path')
const { clipanion } = require('clipanion')
const { exec } = require('child_process')
const { symlinkSync, readlinkSync, existsSync, mkdirSync } = require('fs')

const cwd = process.cwd()
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

    exec(`yarn add ${dependency} ${dependencies.join(' ')}`, {
      cwd: symlink,
      stdio: 'inherit'
    })
  })

clipanion
  .command(`run <command>`)
  .describe(`Run command.`)
  .action(({ command }) => {
    const symlink = getSymLink()

    exec(`yarn ${command}`, {
      cwd: symlink,
      stdio: 'inherit'
    })
  })

clipanion
  .command(`remove`)
  .alias('clean')
  .describe(`Remove current project.`)
  .action(() => {
    const spinner = ora({
      text: 'Removing project link.',
      color: 'red'
    }).start()
    const symlink = getSymLink()
    const realPath = process.env.PWD
    const projectName = basename(realPath)

    process.chdir('../')

    rimraf(symlink, () => {
      rimraf(realPath, () => {
        rimraf(resolve(home, '.drye', projectName), () => {
          spinner.stop()
          console.log('Project was removed.')
        })
      })
    })
  })

clipanion
  .command(`create <name>`)
  .describe(`Create new project.`)
  .action(({ name: projectName }) => {
    const spinner = ora({
      text: 'Creating project with create-react-app.',
      stream: process.stdout,
      color: 'green'
    }).start()

    const projectFolder = resolve(dryeFiles, projectName)

    if (!existsSync(dryeFiles)) {
      mkdirSync(dryeFiles)
    }

    exec(`create-react-app ${projectName}`, {
      cwd: dryeFiles,
      stdio: 'ignore'
    }).on('close', code => {
      if (code === 0) {
        if (!existsSync(resolve(cwd, projectName))) {
          symlinkSync(resolve(projectFolder, 'src'), resolve(cwd, projectName))
        }

        spinner.stop()

        console.log(`Real project folder located at ${projectFolder}`)
        console.log(`Your source files are located at ${cwd}/${projectName}`)
      } else {
        console.log(`Drye failed creating new project.`)
      }
    })
  })

clipanion.runExit(process.argv0, process.argv.slice(2))
