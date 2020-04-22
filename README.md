# retweak

A CLI that tweaks and resends HTTP/S requests!

`retweak` can modify request URLs, methods, headers, or data and then report changes in responses.

## Why?

A common process in pentesting/bug bounties is enumerating web paths. There are many tools to do this (e.g. [dirb](http://dirb.sourceforge.net/), [gobuster](https://github.com/OJ/gobuster)). **Note:** `retweak` can do this but I wouldn't recommend it solely for this purpose since the aforementioned tools are faster/better.

`retweak` comes in handy when you want to change *other* parts of the request. For instance, modifying a URL query parameter or ommitting a JSON field in the request body to see if/how the HTTP/S response changes. Rather than manually editing-and-resending the request in Firefox developer tools or replaying the request with a proxy, you can programmatically tweak and resend requests with `retweak`. You specify a "base request" (method, headers, data, etc), tell `retweak` what part of the request you want to "tweak", and pass a list of values you'd like to test. Then `retweak` fires off a bunch of requests derived from the "base request" with substitions for the values in the list.

I haven't used [Burp Suite](https://portswigger.net/burp) but my understanding is [Burp Repeater](https://portswigger.net/burp/documentation/desktop/tools/repeater) has overlapping functionality (and a UI!). My motivation for writing `retweak` was to create a CLI with request tweaking and resending functionality.

## Install

`$ npm i retweak`

## Usage

`$ retweak -h`

```
Usage: retweak [options] [command] <url>

Options:
  -V, --version                  output the version number
  -d, --data <data/@file>        request data to send
  -H, --headers <headers/@file>  request headers to send
  -j, --json                     write JSON responses to file (only if -o)
  -k, --insecure                 allow insecure TLS connection
  -l, --list <values/@file>      list of values to try
  -o, --output <file>            write all responses to file
  -p, --parallel                 send requests in parallel
  -q, --quiet                    don't show banner and debugging info
  -t, --tweak <part>             part of the request to tweak ["url","method","header","data"]
  -X, --method <method>          request method
  -h, --help                     output usage information

Commands:
  methods <url>                  test all HTTP methods
```

`retweak` searches for an asterisk ("\*") in the part of the request you'd like to tweak. It then substitutes it with the values in `-l, --list` and sends a request for each substitution. If you'd like to review *all* responses in their entirety, you can write them to a file with the `-o, --output` option. The responses are plaintext by default, but you can specify `-j, --json` if you'd like the responses in JSON format.

The CLI adopts some options from [curl](https://curl.haxx.se/) that take a literal value *or* filename as an argument. If you'd like to pass a filename, make sure to prepend it with "@" so the CLI knows you meant to pass a filename! **Note:** for output the argument can *only* be a filename so there's no need to prepend with a "@".

`retweak` tries to assume sensible defaults when options aren't specified. If you provide `-d, --data` but don't specify `-m, --method`, the latter defaults to POST. Otherwise, method defaults to GET. If the method's POST, PUT, or PATCH, `-t, --tweak` defaults to "data". Otherwise, it defaults to "header".

## Examples

### URL query param

The following sends 3 requests with different values for the query parameter, "id".

```
$ retweak -l "1,2,3" -t url "https://<domain>/a/b/c?id=*"
```

### HTTP method

The following sends 3 requests with different HTTP methods.

```
$ retweak -l "POST,PUT,PATCH" -t method <url>
```

`retweak` has a subcommand for testing *all* HTTP methods.

```
$ retweak methods <url>
```

### Header

The following sends 3 requests with different Host headers.

```
$ retweak -H "Host: *" -l "foo.com,bar.foo.com,baz.foo.com" <url>
```

### Cookie

The following sends 3 requests with different values for the "a" cookie.

```
$ retweak -H "Cookie: a=*;expires=sometime" -l "1,2,3" <url>
```

### Request data

The following sends 3 requests with different values for the "foo" key in the JSON payload.

```
$ retweak -d '{"foo": "*"}' -l "bar,baz,bam" <url>
```

## Test

`$ npm test`

## Contributing

Please do!

If you find a bug, want to add a feature, or have a question, feel free to [open an issue](https://github.com/zbo14/retweak/issues/new).

You're also welcome to [create a pull request](https://github.com/zbo14/retweak/compare/develop...) addressing an issue. You should push your changes to a feature branch and request merge to `develop`.
