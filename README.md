

The [bait-4 site](https://baitnickel.github.io/bait-4/index.html) is an experiment, a prototype of a publishing system, stressing strict separation between code and content. Text content may be created in any good markdown editor (Visual Studio Code, Obsidian, &c.). Audio, Video, and Graphic content may be created in any good recording/composing applications (QuickTime, iMovie, Photos, SVG drawing apps, &c.). In theory, as long as the content is in a form that meets HTML rendering standards (txt, md, jpg, mpg, svg, &c. &c.), the system should be able to render it, using properties assigned to the content by the user to determine *how* it is rendered, *how* a collection is sorted and navigated, &c.

`bait-4` is, as the name suggests, the fourth iteration of my website experiments. I've been at it for a few years.

We assume here that you are at least somewhat familiar with the following topics; if not, follow the links:
- [Markdown text files](https://www.markdownguide.org/getting-started/)
- [Standard HTML](https://developer.mozilla.org/en-US/docs/Learn/HTML)
- [Standard JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [TypeScript](https://www.typescriptlang.org/docs/handbook/typescript-from-scratch.html)

We are not using any third-party libraries, only standard JavaScript, so there are no dependencies. We're following the Mozilla documentation strictly, using only code features that are supported on (virtually) all modern browsers.

#### A Static Web Page
Part of the challenge in a static environment is managing data complexity without a `database`. My approach is to maintain data—markdown articles, YAML configuration, &c.—in a separate repository on my localhost machine, and write code in this repository that performs refreshes of the website repository.

(Updated 1/19/2024)