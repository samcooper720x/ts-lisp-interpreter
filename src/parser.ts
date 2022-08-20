import {
  Expression,
  BinaryOperationNames,
  ExpressionParam,
  LiteralType,
  ExpressionType,
  Token,
  TokenType,
  PredicateNames,
  Literal,
  UnaryOperationNames,
} from "./resources/types";

export function parser(tokens: Token[]): Expression {
  const [fstToken, ...restTokens] = tokens;

  if (fstToken && fstToken.type !== TokenType.OPEN_PAREN) {
    throw new SyntaxError("No initial call expression found.");
  }

  const res = parseCallExpression(restTokens);

  return res.callExpression;
}

interface ParseTokens {
  (tokens: Token[], params: ExpressionParam[]): ParseTokens;
}

interface ParsedTokens {
  params: ExpressionParam[];
  remainingTokens: Token[];
}

function parseTokens(
  tokens: Token[],
  params: ExpressionParam[] = []
): ParseTokens | ParsedTokens {
  const [token, ...restTokens] = tokens;

  if (!token) {
    throw new Error("Unexpected eof.");
  }

  if (token.type === TokenType.NUMBER) {
    return parseTokens(restTokens, [
      ...params,
      {
        type: LiteralType.NUMBER_LITERAL,
        value: token.token,
      },
    ]);
  }

  if (token.type === TokenType.QUOTE) {
    const res = parseString(restTokens);

    // For the sake of the type checker...
    if (!("stringLiteral" in res)) {
      throw new Error();
    }

    return parseTokens(res.remainingTokens, [...params, res.stringLiteral]);
  }

  if (token.type === TokenType.OPEN_PAREN) {
    const res = parseCallExpression(restTokens);

    return parseTokens(res.remainingTokens, [...params, res.callExpression]);
  }

  if (token.type === TokenType.CLOSE_PAREN) {
    return { params: params, remainingTokens: restTokens };
  }

  throw new Error(`Unhandled token: ${token.token}`);
}

function parseCallExpression(tokens: Token[]): {
  callExpression: Expression;
  remainingTokens: Token[];
} {
  const [operatorToken, ...restTokens] = tokens;

  if (operatorToken.type !== TokenType.SYMBOL) {
    throw new SyntaxError("Missing operator in call expression.");
  }

  const res = parseTokens(restTokens);

  // For the sake of the type checker...
  if (!("params" in res)) {
    throw new Error();
  }

  if (operatorToken.token === "if") {
    return {
      callExpression: { type: ExpressionType.CONDITIONAL, params: res.params },
      remainingTokens: res.remainingTokens,
    };
  }

  const predicateName = getPredicateName(operatorToken.token);

  if (predicateName) {
    return {
      callExpression: {
        type: ExpressionType.PREDICATE,
        name: predicateName,
        params: res.params,
      },
      remainingTokens: res.remainingTokens,
    };
  }

  const binaryOperationName = getBinaryOperationName(operatorToken.token);

  if (binaryOperationName) {
    return {
      callExpression: {
        type: ExpressionType.BINARY_OPERATION,
        name: binaryOperationName,
        params: res.params,
      },
      remainingTokens: res.remainingTokens,
    };
  }

  const unaryOperationName = getUnaryOperationName(operatorToken.token);

  if (unaryOperationName) {
    return {
      callExpression: {
        type: ExpressionType.UNARY_OPERATION,
        name: UnaryOperationNames.PRINT,
        param: res.params[0],
      },
      remainingTokens: res.remainingTokens,
    };
  }

  throw new SyntaxError(`Unknown operator: ${operatorToken.token}.`);
}

function getPredicateName(token: string): PredicateNames | null {
  switch (token) {
    case "=":
      return PredicateNames.EQUAL;
    case "/=":
      return PredicateNames.NOT_EQUAL;
    case "<=":
      return PredicateNames.LESS_THAN_OR_EQUAL_TO;
    case "<":
      return PredicateNames.LESS_THAN;
    case ">=":
      return PredicateNames.MORE_THAN_OR_EQUAL_TO;
    case ">":
      return PredicateNames.MORE_THAN;
    default:
      return null;
  }
}

function getBinaryOperationName(token: string): BinaryOperationNames | null {
  switch (token) {
    case "+":
      return BinaryOperationNames.ADD;
    case "-":
      return BinaryOperationNames.SUBTRACT;
    case "*":
      return BinaryOperationNames.MULTIPLY;
    case "/":
      return BinaryOperationNames.DIVIDE;
    default:
      return null;
  }
}

function getUnaryOperationName(token: string): UnaryOperationNames | null {
  switch (token) {
    case "print":
      return UnaryOperationNames.PRINT;
    default:
      return null;
  }
}

interface ParseString {
  (tokens: Token[], stringInProgress: string[]): ParseString;
}

function parseString(
  [token, ...restTokens]: Token[],
  stringInProgress = ""
):
  | ParseString
  | {
      stringLiteral: Literal;
      remainingTokens: Token[];
    } {
  if (token.type === TokenType.QUOTE) {
    return {
      stringLiteral: {
        type: LiteralType.STRING_LITERAL,
        value: stringInProgress,
      },
      remainingTokens: restTokens,
    };
  }

  const updatedStringInProgress = stringInProgress
    ? `${stringInProgress} ${token.token}`
    : token.token;

  return parseString(restTokens, updatedStringInProgress);
}
