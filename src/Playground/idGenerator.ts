export default function idGenerator(prefix: string = 'id_') {
  let counter = 0;
  return () => {
    const id = `${prefix}_${counter}`;
    counter++;
    return id;
  };
}
