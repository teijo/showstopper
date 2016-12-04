# Showstopper

Proof-of-concept library for active feedback circuit-breakers.


## The problem

You do a remote service call for which the results are not immediately
available, that is, the side-effect happens after you get a response from the
server. In HTTP responses this would be analogous to getting 'asynchronous'
`202 ACCEPTED` instead of 'synchronous' `200 OK`.

What happens if the side-effect leads to an error when the action is finally
evaluated? How should it be reflected for the client that created the call?
