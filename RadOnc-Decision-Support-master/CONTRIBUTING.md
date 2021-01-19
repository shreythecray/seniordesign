## Workflow Tracking

The basic workflow is:

- Create a GitHub issue.
- Create a branch specific to that issue.
- Create pull requests to get code reviewed, and to merge code into master branch.
- Delete the issue-specific branch.

As a consequence of this workflow, all code is associated with a specific
issue, and all code gets reviewed before being merged into the master branch.

### Issues

Issues are the key GitHub feature used to track the progress and direction of
work within a repository. The use of issues is intended to both provide those
working on an issue with clear goals and an opportunity for discussion
regarding the direction of the project. Issues should be atomic, describing a
single task to accomplish. An issue should include:

- A title describing the purpose of the issue
- A summary of the central problem being addressed by the issue
- An explicit specification for the a proposed solution (can be handled in comments)
- A clear set of conditions/goals to meet before the issue can be closed

### Milestones

 A milestone can optionally be used to describe a goal at a higher level then an
 individual issue. A milestone is a way to collect related issues to be worked
 together. When a feature or other project task cannot succinctly be captured by
 a single issue a milestone can be used to provide additional context to issues
 relating to this higher level task.

### Project Boards

Two GitHub project boards will be actively maintained. One board will outline
future issues that may be vague. A second project board will guide the work for
a given week or _sprint_. Monday meetings should be focused on the task of
bringing issues from the vague/future board into the weekly board, making issues
more explicit and assigning them to the members that will work them.

### Commits

 Commits should be atomic while not breaking any existing tests. While
 additional unit tests can be handled in separate commits all committed code
 should strive for 100% coverage. Commits are made exclusively on branches, while
 bringing code into the master branch is handled exclusively through pull requests.

#### Commit Messages

 The title line of a commit message should be at most 50 characters, imperative
 in tone, and provide a general understanding of what the commit does. The body
 of a commit message should be both succinct and exhaustive **no unmentioned
 changes**. The commit should describe _what_ and _why_ rather then _how_
 something was done. Commit messages should strive for context with the
 assumption that people other then the writer will need to read and understand
 the commit.

 At the bottom of a commit message every commit should reference the issue it is
 associated with by number in order to link the commit to the issue in
 github; see the [github blog post](https://blog.github.com/2011-04-09-issues-2-0-the-next-generation/#commits--issues)
 describing this feature. Additionally github provides keywords to close issues
 automatically when they are merged into the repositories default branch, this
 process is described in the [github help documentation](https://help.github.com/articles/closing-issues-using-keywords/).

### Branches

Branches should be short-lived, created for every issue/pull request, and
deleted after being merged into master. The branch name should not be
completely meaningless.

To create and switch to a new branch, named my-branch-name, use the following command:

```shell
git checkout -b my-branch-name
```

When merging the branch into master on GitHub, you should delete the branch using the GitHub GUI.
You can also use the following command to delete the branch:

```shell
git push origin -d my-branch-name
```

### Pull Requests

A pull request should be generated once tests have been written. The pull request
is intended to facilitate code reviews, and allow opportunities for team members
to provide input as early as possible.

A completed pull request should be small enough to be easily reviewed while large enough
to be meaningful.

Use squash and merge once the pull request has been approved. Ensure that the
commit message follows the style guidelines.

#### Pull Request Checklist

A pull request and the subsequent code review is required to merge any code
into the main branch. Before merging code into the main branch, the pull request
should satisfy the following conditions:

- [ ] 100% coverage with unit tests
- [ ] Passing all tests in project, and any newly added tests
- [ ] Code is fully documented
- [ ] Code comments are free of spelling / grammar / style errors
- [ ] No compiler / IDE / linter warning
- [ ] Reviewed by at least 2 team members not involved in creating the request

A pull request should be made early in the process to facilitate code reviews,
and feedback on design/implementation as early as possible. The pull request
should address a particular issue, or milestone and at a minimum include initial
unit tests for the specifications outlined in its associated issues.

## Code Review

A code review helps the person receiving as well as providing the review by:

- Catching design and code errors.
- Distributing knowledge of the code base among more than one person.
- Enforcing consistent style for code and other artifacts in the repository.

As a reviewer, you should review the code, not the coder. Don't be a jerk. As
the developer, you should understand that reviewing code takes time and effort.
Consequently, feedback should not be dismissed. To request a review assign the
pull request to add members to the "Reviewers" section of the pull request in
GitHub. Once added as a reviewer it is imperative to preform a code review. This
should be done within 24 hours of the request. Note that the agreement between
code reviewers and writers is that the writer will generate a pull request small
enough to be reviewed in 20-30 minutes, and reviewers will supply that crucial
review within 24 hours.

## Style Guides

Google's style guides are exhaustive, public, and written down. These style
guides will be preferred whenever they are available for languages used in the
project.

- [ python style guide](https://github.com/google/styleguide/blob/gh-pages/pyguide.md)


## Testing Framework

[Pytest](https://docs.pytest.org/en/latest/) for Python with test coverage
via the [pytest-cov package](https://pypi.org/project/pytest-cov/) is a more
feature rich unit testing framework then the standard library unittest
package. Allows for easy decoupling of build up / tear down logic from actual
test logic.

Note that unit tests should be a useful documentation tool, make unit tests
clear, informative, and purposeful.
