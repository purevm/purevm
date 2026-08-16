# Block Fetcher

Ce module s’occupe de récupérer des blocs complets et de vérifier la validité des données associées.

Le but est d’obtenir, pour chaque bloc, un état cohérent contenant les données réelles du bloc : transactions, logs et traces.  
Cette vérification est nécessaire car il peut arriver de récupérer des données incohérentes, par exemple lorsqu’un bloc a été remplacé par un autre.

## API

L’API utilise le client `purevm` pour appeler les méthodes suivantes :

- `getBlocksByNumber` : récupère un bloc et ses transactions associées.
- `getBlocksLogsByRange` : récupère les logs associés à une plage de blocs.
- `getBlocksTracesByRange` : récupère les traces associées à une plage de blocs.

Ces appels bruts sont transformés en fonctions capables de récupérer un ou plusieurs blocs en une seule fois.

L’API formate et standardise également les données retournées, en particulier pour les traces.  
En théorie, les traces peuvent être récupérées via les méthodes `debug_*` ou `trace_*`, mais dans la pratique, on utilise uniquement `trace_*`, car c’est la seule approche qui supporte correctement le multi-block fetching.

Les receipts sont ignorés ici car les logs suffisent pour connaître les événements réellement commit :

- Si `receipt.status = 0`, toute la transaction est revert, donc aucun log n’est conservé dans le receipt.
- Si `receipt.status = 1`, des sous-calls peuvent avoir échoué, mais seuls les logs des parties réellement commit apparaissent.

Chaque résultat est organisé dans des objets structurés afin de faciliter l’accès aux données, d’abord par numéro de bloc, puis par index de transaction.

## Resolvers

Les extensions utilisent les méthodes de l’API pour récupérer les blocs, logs et traces.

Elles ajoutent une couche de sécurité pour éviter les doublons et gérer les retries.  
Par exemple, si la récupération des logs sur une plage de blocs échoue, la plage est divisée en deux puis chaque moitié est retentée. Cela permet d’éviter les erreurs lorsque trop de blocs sont demandés en une seule requête.

À terme, le batch fetching des blocs devrait probablement être déplacé ici.  
Cette couche agit comme un transformateur entre les appels API bruts et le multi-block fetching robuste.

## Modules

Les modules utilisent les extensions pour récupérer les blocs, logs et traces.

Le but actuel est de construire un bloc complet contenant :

- le bloc et ses transactions ;
- les logs associés ;
- les traces associées.

Comme les couches précédentes ont déjà validé les données et supprimé les doublons, cette couche se concentre sur la cohérence finale.

Elle vérifie notamment que :

- toutes les données associées à un bloc correspondent au même `blockHash` ;
- chaque transaction peut être reliée à ses logs et/ou traces ;
- un bloc vide ne possède pas de logs ou de traces associés.

Une fois les vérifications terminées, le module retourne un objet complet contenant les blocs, transactions, logs et traces.