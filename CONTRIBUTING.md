# Contributing to pi-workflow-kit

Thanks for your interest in improving pi-workflow-kit!

## Reporting bugs and requesting features

Open an [issue](https://github.com/franndeli/pi-workflow-kit/issues/new/choose) using one of the templates. For bugs, include your pi version (`pi --version`), OS, and the steps to reproduce.

## Development setup

```sh
git clone https://github.com/franndeli/pi-workflow-kit.git
cd pi-workflow-kit
npm install
pi install ./        # load your local checkout into pi
```

pi loads the TypeScript extensions directly, so there is no build step — restart pi (or start a new session) to pick up changes.

## Pull requests

1. Fork the repo and create a branch from `main`.
2. Keep changes focused; one topic per PR.
3. If you change a tool's behavior or a skill's contract, update the README and the relevant `SKILL.md`.
4. Add an entry under **Unreleased** in [CHANGELOG.md](CHANGELOG.md).
5. Open the PR and describe what changed and how you tested it.

## Releasing (maintainers)

1. Bump `version` in `package.json` and move the **Unreleased** changelog entries under the new version.
2. Commit, then tag: `git tag -a vX.Y.Z -m "vX.Y.Z" && git push --follow-tags`.
3. Publish: `npm publish`.
4. Create the GitHub release: `gh release create vX.Y.Z --generate-notes`.

## License

By contributing you agree that your contributions are licensed under the [Apache-2.0 License](LICENSE).
