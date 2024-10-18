

The [bait-4 site](https://baitnickel.github.io/bait-4/index.html) is an experiment, a prototype of a publishing system, stressing strict separation between code and content. Text content may be created in any good markdown editor (Visual Studio Code, Obsidian, &c.). Audio, Video, and Graphic content may be created in any good recording/composing applications (QuickTime, iMovie, Photos, SVG drawing apps, &c.). In theory, as long as the content is in a form that meets HTML rendering standards (txt, md, jpg, mpg, svg, &c. &c.), the system should be able to render it, using properties assigned to the content by the user to determine *how* it is rendered, *how* a collection is sorted and navigated, &c.

`bait-4` is, as the name suggests, the fourth iteration of my website experiments. I've been at it for a few years.

We assume here that you are at least somewhat familiar with the following topics; if not, follow the links:
- [Standard HTML](https://developer.mozilla.org/en-US/docs/Learn/HTML)
- [Standard JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [TypeScript](https://www.typescriptlang.org/docs/handbook/typescript-from-scratch.html)
- [Markdown text files](https://www.markdownguide.org/getting-started/)

We are not using any third-party libraries, only standard JavaScript, so there are no dependencies. We're following the Mozilla documentation strictly, using only code features that are supported on (virtually) all modern browsers. We've written our own markdown and YAML parsers—supporting just the standards we need, and allowing for some subtle customizations to fit well with the site's requirements. 

We've barely touched the CSS—little patience for it at this point. This is why the pages look and feel so primitive. Someone with a good eye for aesthetics might offer us suggestions

#### A Static Web Page
Part of the challenge in a static environment is managing data complexity without a `database`. My approach is to maintain data—markdown articles, YAML configuration, &c.—in a separate node.js repository on my localhost machine, and write code there that performs refreshes of the content and configuration files in the website repository.

This is a good way to refresh the content in a site—all we have to do is run a node.js script we've written, called `promote`, that pulls new and updated content from local (mostly markdown) files, rebuilds index files, and writes it all the the localhost pages. But making a site feel truly dynamic is challenging. Challenges are good, of course; the rest is all mundane.

(Updated 10/18/2024)