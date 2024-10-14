/**
 * Overwrites a part of buffer with incoming, while maintaining the length and original contents
 * of the buffer. Returns a new buffer, without modifying the original.
 */
export const overwriteString = (
  buffer: string,
  incoming: string,
  offset: number
): string => {

  // if the incoming string is so far to the left that it isn't visible, just return the original
  if (offset <= -incoming.length){
    return buffer;

  // otherwise, if it's so far to the right that it isn't visible, also just return the original
  } else if (offset > buffer.length){
    return buffer;
  }

  let newBuffer;

  // if the incoming string is partially off the left side of the buffer, start partway through the incoming string
  if (offset < 0){
    newBuffer = incoming.slice(-offset);

  // otherwise, keep the start of the original buffer then append the incoming buffer. Don't worry about length yet.
  } else {
    newBuffer = buffer.slice(0, offset) + incoming;
  }

  // if the resulting string is the same length as the original, return it
  if (newBuffer.length === buffer.length){
    return newBuffer;
  
  // if it's too long, return just enough to fill the original buffer length
  } else if (newBuffer.length > buffer.length){
    return newBuffer.slice(0, buffer.length);

  // if it's too short, append the rest of the original buffer
  } else {
    return newBuffer + buffer.slice(newBuffer.length);
  }
}

/**
 * Returns a new buffer, without modifying the original.
 * @See overwriteString
 */
export const overwriteArray = <T>(
  buffer: T[],
  incoming: T[],
  offset: number
): T[] => {
  if (offset < -incoming.length){
    return buffer;
  } else if (offset > buffer.length){
    return buffer;
  }

  let newBuffer;
  if (offset < 0){
    newBuffer = incoming.slice(-offset);
  } else {
    newBuffer = buffer.slice(0, offset).concat(incoming);
  }

  if (newBuffer.length === buffer.length){
    return newBuffer;
  } else if (newBuffer.length > buffer.length){
    return newBuffer.slice(0, buffer.length);
  } else {
    return newBuffer.concat(buffer.slice(newBuffer.length));
  }
};