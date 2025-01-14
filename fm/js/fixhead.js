console.info('hey! - bleh pre-loader');

console.info(document.head);

if (!document.head)
    document.head = document.documentElement;

console.info(document.head);