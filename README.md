# retweak

A CLI that tweaks and resends HTTP/S requests!

`retweak` can modify request URLs, methods, headers, or data and report changes in responses.

## But why?

A common process in pentesting/bug bounties is web path enumeration. There are many tools to do this (e.g. [dirb](http://dirb.sourceforge.net/), [dirsearch](https://github.com/maurosoria/dirsearch), [gobuster](https://github.com/OJ/gobuster)). **Note:** `retweak` can do this but I wouldn't recommend it solely for this purpose since the aforementioned tools are better/faster.

`retweak` comes in handy when you want to change *another* part of the request (e.g. URL query parameter, request body JSON) to see if/how the response changes. Rather than manually editing and resending the request in Firefox developer tools or replaying the request with a proxy, you can programmatically tweak and resend requests with `retweak`.

The way it works is you define a "base request" (URL, method, headers, data), tell `retweak` what part of the request to "tweak", and pass a list of values. Then `retweak` fires off a bunch of requests. Each request is derived from the "base request" and includes one of the values in the list. Each value is injected into the request at a location you specify.

I haven't used [Burp Suite](https://portswigger.net/burp) but my understanding is [Burp Repeater](https://portswigger.net/burp/documentation/desktop/tools/repeater) has a likeminded goal of modifying and resending HTTP/S requests (and it has a UI :)). My motivation for writing `retweak` was to create a CLI you could easily pull off the shelf to automate this process. If there are other tools you think I should know about or mention here, please [bring them up](#Contributing)!

## Install

`$ npm i retweak`

## Usage

`$ retweak -h`

```
Usage: retweak [options] [command] <url>

Options:
  -V, --version                       output the version number
  -d, --data <data/@file>             request data to send
  -H, --headers <headers/@file>       request headers to send
  -i, --ignore-headers <names/@file>  don't report changes in these headers
  -j, --json                          write JSON responses to file (only if -o)
  -k, --insecure                      allow insecure TLS connection
  -l, --list <values/@file>           list of values to try
  -m, --max-data <size>B/KB           don't report data when it's over this size
  -o, --output <file>                 write all responses to file
  -p, --parallel                      send requests in parallel
  -q, --quiet                         don't show banner and debugging info
  -t, --tweak <part>                  part of the request to tweak ["url","method","header","data"]
  -X, --method <method>               request method
  -h, --help                          output usage information

Commands:
  hosts <url>                         test a bunch of values for the Host header
  methods <url>                       test all HTTP methods
```

`retweak` searches for an asterisk ("\*") in the part of the request you'd like to tweak (unless you're tweaking the request method). Then it injects each value in `-l, --list` at that location and sends a request for each "injection".

If you'd like to review *all* responses in their entirety, you can write them to a file with the `-o, --output` option. The responses are plaintext by default, but you can specify `-j, --json` if you'd like the responses in JSON format.

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

`retweak` has a subcommand for injecting a bunch of values in the Host header.

```
$ retweak hosts <url>
```

**Note:** you can use `-l, --list` if you have a list of hosts, otherwise `retweak` will use its own.

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
