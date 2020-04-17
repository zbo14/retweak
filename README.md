# retweak

A CLI that tweaks and resends HTTP/S requests!

`retweak` can modify request URLs, methods, headers, or data.

## Install

`$ npm i retweak`

## Usage

`$ retweak -h`

```
Usage: retweak [options] <url>

Options:
  -V, --version                  output the version number
  -d, --data <data/@file>        request data to send
  -H, --headers <headers/@file>  request headers to send
  -l, --list <values/@file>      list of values to try
  -j, --json                     write JSON responses to file (only if -o)
  -o, --output <file>            write all responses to file
  -p, --parallel                 send requests in parallel
  -q, --quiet                    don't show banner and debugging info
  -t, --tweak <part>             part of the request to tweak ["url","method","header","data"]
  -X, --method <method>          request method
  -h, --help                     output usage information
```

`retweak` searches for an asterisk ("\*") in the part of the request you'd like to tweak. It then substitutes it with the values in `-l, --list` and sends a request for each substitution. When `retweak` receives a new status code, it will report the status code and the corresponding request. If you'd like to observe *all* responses (including headers and data), you can write them to a file with the `-o, --output` option. The responses are plaintext by default, but you can specify `-j, --json` if you'd like the responses in JSON format.

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
